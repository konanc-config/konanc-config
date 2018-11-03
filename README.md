konanc-config
=============

Command line utility to read `*.kc` konanc config files to print compiler flags.

## Installation

```sh
$ npm install @datkt/konanc-config -g
```

## Usage

```sh
usage: konanc-config: [-hV] [options] <configs>

where options can be:

  -h, --help                    Print this message
  -V, --version                 Print program version
  -c, --cflags                  Print compiler flags
  -r, --repos, --repositories   Print repositories
  -l --libs, --libraries        Print libraries

```

## Example

```sh
$ konanc-config module.kc --libraries --repos --cflags
-opt -r /home/werle/repos/datkt/konanc-config/node_modules/@datkt -l sodium/sodium -l tape/tape
```

where `module.kc` is

```ini
library[] = sodium/sodium
library[] = tape/tape
cflags[] = -opt
repo[] = "${__dirname}/node_modules/@datkt"
```

## See Also

* https://github.com/pkgconf/pkgconf
* https://github.com/Distrotech/pkg-config

## License

MIT
