# csv-to-redirect

Simple command line utility to convert a CSV to redirect files for Nginx, Apache and vue-router redirects.

The CSV file needs to have at least two rows named `url` for the base url and `redir` for the redirect location.

## Install

```
  npm install -g @kissmy/csv-to-redirect
```

## Usage

```
Usage: csv-to-redirect [options]

Options:
  -V, --version             output the version number
  -i, --input <path>        Input CSV file (required)
  -o, --output <path>       Output file name (Defaults to outputing to terminal)
  -t, --type <type>         Output type [nginx, apache, vue] (required)
  -s, --source <name>       Source cell name (default: "source")
  -d, --destination <name>  Destination cell name (default: "destination")
  -h, --help                output usage information
```
