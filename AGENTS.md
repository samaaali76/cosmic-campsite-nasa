# Repository Workflow Instructions

These instructions apply to all work in this repository. Preserve the existing project structure and all contributor work.

## Before starting a task

1. Confirm the repository root and current branch.
2. Run `git status` and inspect every modified and untracked file before editing.
3. Run `git fetch origin`, then compare the current branch with its remote tracking branch to determine whether it is ahead or behind.
4. Never discard, overwrite, or silently include unrelated existing changes. If uncommitted changes could conflict with the task, stop and ask the user before proceeding.
5. Never work directly on `main` or `master`. If the current branch is `main` or `master`, ask the user before creating or switching branches.
6. Never automatically merge unrelated team branches.

## While implementing

1. Read and understand the relevant existing code before changing it.
2. Preserve the current architecture: HTML, CSS, Vanilla JavaScript ES modules, and JSON data.
3. Avoid unnecessary dependencies.
4. Keep changes scoped to the requested task. Do not modify teammates' features or files unless required.
5. Preserve existing functionality; do not remove working features to make a new feature work.

## Before committing

1. Run relevant checks and tests for the changed functionality.
2. Check JavaScript syntax and JSON validity when those files are affected.
3. Test the affected experience in a browser when possible. Clearly report when browser testing was unavailable.
4. Run `git diff --check` and review the complete diff.
5. Confirm the staged files are all related to the current task and contain no secrets, credentials, or unrelated work.
6. Fix test failures or report them accurately. Never claim checks or tests passed unless they were run.

## GitHub workflow

After a task is implemented and its relevant checks pass:

1. Stage only files related to the current task.
2. Create a descriptive commit message and commit the changes.
3. Push the commit to the current working branch on `origin`.
4. Verify the push succeeded.
5. Report the commit hash, branch, changed files, test results, and push status.

The user authorizes routine `git add`, `git commit`, and `git push` operations for completed tasks without additional confirmation, provided all safety checks pass. This does not authorize including unrelated changes or bypassing any rule below.

## Strict safety rules

- Never run `git push --force`, `git reset --hard`, or `git clean`.
- Never delete or overwrite existing work.
- Never push directly to `main` or `master`.
- Never commit unrelated changes or silently include unrelated existing commits when pushing.
- Never bypass merge conflicts or resolve them by automatically choosing one side.
- If authentication, permissions, network access, conflicts, or another safety issue prevents a push, stop and explain the issue; never imply the push succeeded.
- If the current branch is behind its remote and cannot be safely fast-forwarded, stop and ask the user before proceeding.

## Final report

At the end of each task, report:

- What was implemented.
- Files created or modified.
- Checks and tests performed and their results.
- Commit message and hash, if committed.
- Branch name.
- GitHub push status.
- Remaining issues or unverified behavior.
