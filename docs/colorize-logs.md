# colorize-logs

NDJSON log colorizer and tailer for Nora (companion docs).

## Synopsis

This script reads newline-delimited JSON (NDJSON) log files and prints a colorized, human-friendly
view to the terminal. It supports tailing live files and selective level filtering.

## Usage

```bash
yarn colorize-logs [--path <file>] [--no-follow] [--levels <levels>] [--depth N]
                [--use-env-log-path] [--show-latest] [--help]
```

## Examples

- `yarn colorize-logs` — search CWD then fallback log dir and tail the latest
- `yarn colorize-logs --path ./app.log --no-follow` — print file once and exit
- `yarn colorize-logs --levels info,debug --show-latest` — show only info/debug from latest file

## Flags

- `--path, -p` — Path to a specific log file.
- `--no-follow, -n` — Read once and exit instead of tailing the file.
- `--levels, -l` — Comma-separated log levels to include (e.g., `info,debug,error`).
- `--depth` — JSON pretty-print depth for `data` fields (default: `2`).
- `--use-env-log-path` — Use `LOG_PATH` environment variable as the log directory.
- `--show-latest` — Skip selection and use the latest matching log file.
- `--help, -h` — Show usage information.

## Notes

- The script searches the current working directory for files matching `*.log`, `*.ndjson`, or `*.txt`.
- If none are found, it falls back to `%APPDATA%/nora/logs` on Windows or `$HOME/nora/logs` on Unix-like systems.

## Integration

Add an npm/yarn script to `package.json` if you want a shortcut:

```json
"scripts": {
  "colorize-logs": "tsx scripts/colorize-logs.ts"
}
```

## Troubleshooting

- If colors look wrong, try running in a terminal that supports ANSI colors.
- For very large log files, use `--no-follow` to avoid excessive memory usage when previewing.
