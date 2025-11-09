---
allowed-tools:
  - Bash(npm run:**)
  - Bash(yarn:**)
  - Bash(npx:**)
  - Bash(git log:**)
  - Bash(git diff:**)
  - FileRead
  - FileWrite
description: Debug failing tests or runtime issues systematically
---

## Context

- Error logs: !`pnpm run dev 2>&1 | tail -10` or !`pnpm run test 2>&1 | tail -10`
- Recent changes: !`git diff HEAD~3..HEAD --name-only`
- Arguments: $ARGUMENTS

## Your task

Parse arguments (use `--help` for full usage):

- `--error "error message"` - specific error to investigate
- `--since "commit-hash"` - check changes since specific commit (default: HEAD~3)
- `--environment dev|test|build` - which environment is failing (default: test)
- `--component "ComponentName"` - focus on specific component
- `--verbose` - include detailed logging in debug process
- `--help` - show usage examples

**Examples**: `--error "Cannot read property" --verbose`, `--environment build --since HEAD~5`

1. **Reproduce issue** - run failing command with specified environment and capture error
2. **Analyze error stack** - identify root cause and affected files
3. **Check recent changes** - review commits since specified point that might have introduced issue
4. **Create minimal test** - write failing test that reproduces the bug (if not test-related)
5. **Fix systematically** - implement fix following proven methodologies
6. **Verify fix** - ensure all tests pass and issue resolved in specified environment

Use scientific debugging approach: hypothesis, test, analyze, repeat.
