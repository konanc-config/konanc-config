const { extname, dirname, resolve, sep: PATH_SEPARATOR } = require('path')
const { existsSync, accessSync, statSync } = require('fs')
const { parse } = require('rc/lib/utils')
const debug = require('debug')('konanc-config')
const union = require('array-union')
const find = require('find-up').sync
const rc = require('rc')

module.exports = load
module.exports.load = load

const PROTOCOL_REGEX = /[a-zA-Z0-9|+|-]+:\/\//
const PACKAGE_CONF = process.env.PACKAGE_CONF || 'package.kc'

function load(name, defaults, env, children) {
  let resolved = false

  if (!name || 'string' != typeof name) {
    throw new TypeError("Expecting name to be a non-empty string.")
  }

  try {
    if ('.kc' != extname(name) && !existsSync(resolve(name + '.kc'))) {
      if (statSync(name).isDirectory()) {
        debug('resolved %s in %s', PACKAGE_CONF, name)
        name = resolve(name, PACKAGE_CONF)
        resolved = true
      }
    }
  } catch (err) {
    debug(err)
  }

  const paths = [
    resolve('.'),
    find(resolve('..', 'node_modules')),
    find(resolve('node_modules')),
    resolve('..'),
  ].filter(Boolean)

  try {
    name = require.resolve(name, { paths })
    resolved = true
  } catch (err) {
    debug(err)
    try {
      name = require.resolve(`${name}/${PACKAGE_CONF}`, { paths })
      resolved = true
    } catch (err) {
      debug(err)
    }
  }

  const config = resolve('.kc' == extname(name) ? name : `${name}.kc`)
  const cwd = process.cwd()

  if (!env || 'object' != typeof env) {
    env = {}
  }

  const prefix = env.PREFIX || 'node_modules' + PATH_SEPARATOR

  const conf = rc(name, defaults, { config }, (content) => {
    Object.assign(env, process.env, {
      __dirname: resolve(dirname(config)),
      __filename: resolve(config),
      resolve(lookup) {
        debug('resolve lookup:', lookup)
        return find(lookup)
      }
    })

    return parse(template(content))
  })


  resolved = true

  if (!conf || !conf.config || !conf.configs || !conf.configs.length) {
    try {
      accessSync(resolve(prefix, name))
      if (name != resolve(prefix, name)) {
        return load(resolve(prefix, name), defaults, env, children)
      } else {
        return conf
      }
    } catch (err) {
      return conf
    }
  }

  normalize('library')
  normalize('require')
  normalize('cflags')
  normalize('repo')

  // Addss prefixes to all repository paths ahead of time
  // if not already defined by some configuration file. If
  // the path does not exist, it will be filtered out later
  for (const repo of conf.repo.slice()) {
    const prefixed = prefix + repo
    if (!conf.repo.includes(prefixed)) {
      conf.repo.push(prefixed)
    }
  }

  // Attempts
  for (const repo of conf.repo) {
    if ('string' == typeof repo && !PROTOCOL_REGEX.test(repo)) {
      const relative = find(resolve(dirname(config), repo))
      const resolved = find(repo)

      if (relative && !conf.repo.includes(relative)) {
        conf.repo.push(relative)
      }

      if ('/' != repo[0] && resolved && !conf.repo.includes(resolved)) {
        conf.repo.push(resolved)
      }
    }
  }

  conf.repo = conf.repo.map((repo) => {
    if ('string' == typeof repo && !PROTOCOL_REGEX.test(repo)) {
      return resolve(dirname(config), repo)
    } else {
      return repo
    }
  })

  conf.repo = conf.repo.filter((repo) => {
    if ('string' == typeof repo && PROTOCOL_REGEX.test(repo)) {
      return true
    }

    try {
      return statSync(repo).isDirectory()
    } catch (err) {
      debug(err)
      return false
    }
  })

  conf.library = conf.library.map((library) => {
    if (!library || 'string' != typeof library) {
      return ''
    }

    if ('.' + PATH_SEPARATOR == library.slice(0, 2)) {
      return resolve(dirname(config), library)
    }
    return library
  })

  children = children || []

  // 1. read each require, from left to right, loading respective conf
  // 2. extend top level object from right to left: merge(objects[i], objects[i-1])
  for (let dep of conf.require) {
    if (!dep) {
      continue
    }

    if ('.' == dep[0]) {
      dep = resolve(dirname(config), dep)
    }

    const prefixed = (prefix + dep)
      .replace(
        PATH_SEPARATOR.repeat(2),
        PATH_SEPARATOR
      )

    if (visit(dep)) {
      debug('visit', dep);
      children.push(visit.last)
    } else if (visit(prefixed)) {
      debug('visit (prefixed)', dep);
      children.push(visit.last)
    } else {
      for (const repo of conf.repo) {
        if (repo && 'string' === typeof repo) {
          if (visit(resolve(repo, dep))) {
            children.push(visit.last)
          }
        }
      }
    }
  }

  for (let i = 0; i < children.length; ++i) {
    merge(children[i], children[i + 1])
  }

  if (children.length) {
    const { configs } = conf
    merge(children[0], conf)
    children[0].configs = configs
    return children[0]
  }

  return conf

  function normalize(key) {
    if ('string' == typeof conf[key]) {
      conf[key] = [ conf[key] ]
    }

    if (!Array.isArray(conf[key])) {
      conf[key] = []
    }
  }

  function visit(dep) {
    try {
      const last = load(dep, defaults, env, children)
      if (last && last.configs && last.configs.length) {
        visit.last = last
      } else {
        visit.last = null
      }
    } catch (err) {
      visit.last = null
      debug(err)
    }

    return visit.last
  }

  function merge(target, src) {
    if (!target || !src) {
      return
    }

    if ('object' != typeof target || 'object' != typeof src) {
      return
    }

    for (const k in src) {
      if (!Array.isArray(src[k])) {
        src[k] = [ src[k] ]
      }

      if (!Array.isArray(target[k])) {
        target[k] = [ target[k] ]
      }

      target[k] = union(target[k], src[k])
    }
  }

  function template(content) {
    const vars = Object.keys(env)
    const decls = vars.map((key) => `const ${key} = ${key}_value;`).join('\n')
    const values = vars.map((key) => env[key])
    const params = vars.map((key) => `${key}_value`)
    const interop = '\n return (`' + content + '`);'
    const generator = Function.apply(null, params.concat(decls + interop))

    return generator.apply(null, values)
  }
}
