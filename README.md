# winsay

A Windows-friendly cowsay-style CLI built with [Bun](https://bun.sh) and TypeScript. Prints a cow with your message (or a random quote) in an ASCII speech or thought bubble.

## Prerequisites

- [Bun](https://bun.sh) (JavaScript runtime)
- TypeScript (peer dependency)

## Installation

```bash
bun install
```

## Usage

### Message argument

```bash
bun run winsay hello world
```

### Piped stdin

```bash
echo hi | bun run winsay
```

### No arguments (message precedence)

1. **Args** – If you pass a message, it’s used.
2. **Piped stdin** – If stdin is piped and non-empty, it’s used.
3. **Random quote** – Otherwise a random line from `quotes.txt` is used.

```bash
bun run winsay
# Interactive TTY: prints a random quote immediately
# Piped empty stdin: also falls back to random quote
```

### Random quote format and attribution

When you supply no message, winsay picks a random line from `quotes.txt`. Lines can be:

- **Plain text** – `The quote here`
- **Quote with author** – `The quote here|Author Name` (pipe-separated)

When a quote has an author, the attribution (e.g. `— Author Name`) appears **inside** the speech or thought bubble, as the last line before the bottom border.

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--wrap <n>` | Wrap text to n columns (minimum 5) | 40 |
| `--thought` | Use thought bubble instead of speech bubble | speech |
| `-h`, `--help` | Print usage | — |

### Examples

```bash
# Wrap to 10 columns
bun run winsay --wrap 10 one two three four

# Thought bubble
bun run winsay --thought ponder this
```

## Message precedence

1. **CLI args** – Message from arguments always wins.
2. **Piped stdin** – When stdin is piped (e.g. `echo x | winsay`), stdin content is used if non-empty.
3. **Random quote** – If no args and no stdin content, a random line from `quotes.txt` is used.

## Error behavior

- **Quotes file missing or empty** – Exits with code 1 and prints `winsay: quotes file missing or empty` when the random-quote fallback is needed but `quotes.txt` is missing, empty, or unreadable.
- **Empty message** – Exits with code 1 and prints `winsay: message is empty`.

## Development

| Command | Description |
|---------|-------------|
| `bun test` | Run tests |
| `bun run build` | Build to `dist/` |
| `bun run start` | Run winsay |
| `bun run winsay` | Run winsay CLI |

## Interactive terminal (TTY) and stdin

When running with **no arguments**:

- **Interactive TTY** – stdin is not read (reading would block until EOF). winsay goes straight to the random-quote fallback and prints immediately.
- **Piped stdin** – stdin is read. If it has content, that content is used; if it’s empty, the random quote fallback is used.

Example: `echo hi | bun run winsay` uses `hi`; `bun run winsay` in an interactive terminal prints a random quote.
