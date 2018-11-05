konanc-config
=============

Command line utility to read `*.kc` konanc config files to print compiler flags.

## Installation

```sh
$ npm install @datkt/konanc-config -g
```

## Latest Release

Prebuilt binaries for `konanc-config` are available for download for Linux,
Windows, and macOS. They can be downloaded from the [latest
release](https://github.com/datkt/konanc-config/releases/latest) page.

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
repo[] = "node_modules/@datkt"
```

## Writing A Config File

Configuration files for the `konanc-config` command are in INI or JSON
format. Any property can be defined, but currently, the command only
supports printing libraries, repositories, and compiler flags.

### Adding Libraries

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

### Adding Repositories

A repository that should be used for searching library (`.klib`) files
can be expressed by defining the `repo` variable. This intuitively maps
to the `-repo` flag for the `konanc` command.

```ini
repo = "node_modules/@datkt/sodium"
```

or multiple repositories

```ini
repo[] = "node_modules/@datkt/sodium"
repo[] = "node_modules/@datkt/tape"
```

### Adding Compiler Flags

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

### Requiring Dependency Configuration

Requiring a dependency configuration can be expressed by defining the
`require` variable. Dependencies can be a fully qualified path or
relative to a repository.

```ini
require = "sodium/sodium"
repo = "./node_modules/@datkt"
```

or with multiple cependencies

```ini
require[] = "sodium/sodium"
require[] = "uint64be/uint64be"
```

### Environment & Global Rariables

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

### Printing Library Flags

To print library flags, use `-l`, `--libs`, or `--libraries` flags.

```sh
$ konanc-config library.kc --libs
```

### Printing Repository Flags

To print repository flags, use `-r`, `--repos`, or `--repositories` flags.

```sh
$ konanc-config library.kc --repos
```

### Printing Compiler Flags

To print compiler flags, use `-c` or `--cflags` flags.

```sh
$ konanc-config library.kc --cflags
```

## See Also

* https://github.com/pkgconf/pkgconf
* https://github.com/Distrotech/pkg-config

## License

MIT
