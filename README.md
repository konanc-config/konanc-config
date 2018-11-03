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

## Writing a config file

Configuration files for the `konanc-config` command are in INI or JSON
format. Any property can be defined, but currently, the command only
supports printing libraries, repositories, and compiler flags.

### Adding libraries

A library that should be linked against can be expressed by defining the
`library` variable. This intuitively maps to the `-library` flag for the
`konanc` command.

```ini
library = sodium
```

or multiple libraries

```ini
library[] = sodium
library[] = tape
```

### Adding repositories

A repository that should be used for searching library (`.klib`) files
can be expressed by defining the `repo` variable. This intuitively maps
to the `-repo` flag for the `konanc` command.

```ini
repo = "${__dirname}/node_modules/@datkt/sodium"
```

or multiple repositories

```ini
repo[] = "${__dirname}/node_modules/@datkt/sodiumm"
repo[] = "${__dirname}/node_modules/@datkt/tape"
```

### Adding compiler flags

Arbitrary compiler flags can be expressed by defining the `cflags`
variable.

```ini
cflags = -opt -verbose
```

or multiple compiler flags

```ini
cflags[] = -opt
cflags[] = -verbose
```

### Environment/Global Variables

Every configuration file gets access to current environment variables
exposes to the program. Special `__dirname` and `__filename` free floating
variables give access to the directory name and file name of the
configuration file.

## Printing `konanc` flags

To print flags suitable for the `konanc` command useful for
shell interpolation, invoke the `konanc-config` command with any
combination of the supported flags found in the usage help. Short flags
can be used for brevity, like `konanc-config -clr library.kc`, in place
of `konanc-config library.kc --cflags --libraries --repos`.

### Printing library flags

To print library flags, use `-l`, `--libs`, or `--libraries` flags.

```sh
$ konanc-config library.kc --libs
```

### Printing repository flags

To print repository flags, use `-r`, `--repos`, or `--repositories` flags.

```sh
$ konanc-config library.kc --repos
```

### Printing compiler flags

To print compiler flags, use `-c` or `--cflags` flags.

```sh
$ konanc-config library.kc --cflags
```

## See Also

* https://github.com/pkgconf/pkgconf
* https://github.com/Distrotech/pkg-config

## License

MIT
