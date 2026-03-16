# alpine-install-claude

One-command installer for [Claude Code](https://claude.ai/code) on Alpine Linux.

Alpine Linux uses musl libc and a minimal base, which requires a few extra packages before Claude Code can run. This tool handles everything and launches Claude.

## Usage

```sh
npx alpine-install-claude
```

That's it. The script will:

1. Install required system packages via `apk`
2. Set `USE_BUILTIN_RIPGREP=0` in your shell profile (uses Alpine's native ripgrep instead of the bundled glibc binary)
3. Install Claude Code via the official native binary installer
4. Launch `claude`

Any arguments are passed through to `claude`:

```sh
npx alpine-install-claude --version
```

## What gets installed (apk)

| Package | Why |
|---|---|
| `bash` | Claude Code requires bash (Alpine defaults to ash) |
| `git` | Required for Claude's git operations |
| `curl` | Used to fetch the Claude installer |
| `libgcc` | GNU C runtime — needed by the native binary |
| `libstdc++` | GNU C++ library — needed by the native binary |
| `ripgrep` | Fast search used by Claude (`rg`) |

## Requirements

- Alpine Linux
- Node.js >= 18 (just enough to run `npx`)
- Root or `sudo` access (for `apk add`)

## License

MIT
