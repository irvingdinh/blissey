---
name: commit
description: Commit the Git changes
---

## Instructions

1. **Stage all changes**: Run `git add -A` to stage all modified and untracked files
2. **Review changes**: Run `git status` and `git diff --staged` to understand all staged changes
3. **Run checks**: Execute `make check` to ensure all tests and linting pass before proceeding. If checks fail, fix the issues before continuing.
4. **Write commit message**: Create a commit message following Conventional Commits format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding/updating tests
   - `chore:` for maintenance tasks
   - Use imperative mood (e.g., "Add feature" not "Added feature")
   - Keep the subject line concise (under 72 characters)
   - Add body if needed to explain the "why"
5. **Commit**: Execute the commit with Co-Authored-By trailer

## Commit Message Format

```
<type>: <subject>

<optional body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Notes

- Do NOT push to remote unless explicitly asked
- If there are no changes to commit, inform the user instead of creating an empty commit
