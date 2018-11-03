const { extname, dirname, resolve } = require('path')
const { parse } = require('rc/lib/utils')
const rc = require('rc')

module.exports = load
module.exports.load = load

function load(name, defaults, env) {
  if (!name || 'string' != typeof name) {
    throw new TypeError("Expecting name to be a non-empty string.")
  }

  const config = '.kc' == extname(name) ? name : `${name}.kc`
  if (!env || 'object' != typeof env) {
    env = {}
  }

  return rc(name, defaults, { config }, (content) => {
    Object.assign(env, process.env, {
      __dirname: resolve(dirname(config)),
      __filename: resolve(config),
    })
    return parse(template(content))
  })

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
