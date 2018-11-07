const { extname, dirname, resolve } = require('path')
const { accessSync, statSync } = require('fs')
const { parse } = require('rc/lib/utils')
const debug = require('debug')('konanc-config')
const find = require('find-up').sync
const rc = require('rc')

module.exports = load
module.exports.load = load

const PROTOCOL_REGEX = /[a-zA-Z0-9|+|-]+:\/\//
const PACKAGE_CONF = process.env.PACKAGE_CONF || 'package.kc'

function load(name, defaults, env) {
  if (!name || 'string' != typeof name) {
    throw new TypeError("Expecting name to be a non-empty string.")
  }

  try {
    if (statSync(name).isDirectory()) {
      debug('resolved %s in %s', PACKAGE_CONF, name)
      name = resolve(name, PACKAGE_CONF)
    }
  } catch (err) {
    debug(err)
  }

  const config = '.kc' == extname(name) ? name : `${name}.kc`
  const cwd = process.cwd()

  if (!env || 'object' != typeof env) {
    env = {}
  }

  const prefix = env.PREFIX || 'node_modules/'

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

  if ('string' == typeof conf.repo) {
    const { repo } = conf

    if (!PROTOCOL_REGEX.test(repo)) {
      conf.repo = [ resolve(dirname(config), repo) ]
    } else {
      conf.repo = [ repo ]
    }

    if (!conf.repo.includes(repo)) {
      conf.repo.push(repo)
    }
  }

  if (Array.isArray(conf.repo)) {
    // add prefixed repos
    for (const repo of conf.repo.slice()) {
      const prefixed = prefix + repo
      if (!conf.repo.includes(prefixed)) {
        conf.repo.push(prefixed)
      }
    }

    for (const repo of conf.repo) {
      if ('string' == typeof repo && !PROTOCOL_REGEX.test(repo)) {
        const path = resolve(repo)
        const found = find(repo)

        if (path && !conf.repo.includes(path)) {
          conf.repo.push(path)
        }

        if ('/' != repo[0] && found && !conf.repo.includes(found)) {
          conf.repo.push(found)
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
        accessSync(repo)
        return statSync(repo).isDirectory()
      } catch (err) {
        debug(err)
        return false
      }
    })
  }

  if (conf.require && conf.require.length) {
    if (!Array.isArray(conf.require)) {
      conf.require = [ conf.require ]
    }

    const repos = (conf.repo && !Array.isArray(conf.repo)
      ? [ conf.repo ]
      : conf.repo)

    for (const dep of conf.require) {
      merge(conf, load(dep, defaults, env))
      for (const repo of repos) {
        if (repo && 'string' === typeof repo) {
          merge(conf, load(resolve(repo, dep), defaults, env))
        }
      }
    }
  }

  return conf

  function merge(target, src) {
    if (!target || !src ) {
      return
    }

    if ('object' != typeof target || 'object' != typeof src) {
      return
    }

    for (const k in src) {
      if (Array.isArray(src[k])) {
        if (Array.isArray(conf[k])) {
          for (const x of src[k]) {
            if (!conf[k].includes(x)) {
              conf[k].push(x)
            }
          }
        } else if ('string' == typeof conf[k]) {
          if (src[k].includes(conf[k])) {
            conf[k] = src[k]
          } else {
            conf[k] = [ conf[k] ].concat(src[k])
          }
        } else {
          conf[k] = src[k]
        }
      } else if ('string' == typeof src[k]) {
        if (Array.isArray(conf[k])) {
          if (!conf[k].includes(src[k])) {
            conf[k].push(src[k])
          }
        } else if ('string' == typeof conf[k]) {
          if (conf[k] != src[k]) {
            conf[k] = [ conf[k], src[k] ]
          }
        }
      } else if ('object' == typeof src[k]) {
        if ('object' == typeof target[k]) {
          merge(src[k], target[k])
        } else if (null != target[k] && 'undefined' != typeof target[k]) {
          throw new TypeError("Cannot merge source object into target string.")
        } else {
          target[k] = src[k]
        }
      }
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
