# Issue-to-PR automation

The workflow supports approved frontend tasks: add, modify, or delete regular `.ts`, `.html`, and `.css` files under `src/app/`, and edit `src/styles.css`. This includes components, services, templates, styles, and unit tests. New files are included in the exported patch.

Dependencies, lockfiles, workflow files, deployment files, environment configuration, other entry points, and tracked dist outputs remain outside scope. Such tasks need a separate infrastructure or configuration PR. The agent must report the limitation instead of bypassing it. No-change results, changes outside scope, symlinks, and agent-created commits stop the run before validation.

## One-time setup

1. Merge the infrastructure PR into the default branch. Label-triggered workflows must exist on that branch.
2. Add a repository Actions secret named `OPENAI_API_KEY` with an API project key and available billing. ChatGPT subscriptions do not supply API usage. Never put the key in an issue or commit.
3. In Settings → Actions → General, allow the referenced actions and enable “Allow GitHub Actions to create and approve pull requests.” This workflow only creates draft PRs; it never approves, merges, or deploys. Organization policy may require an administrator.
4. Create a label named `agent-ready`. Add it to an approved, open issue to launch a billable Codex run. The official Codex action verifies that the triggering user has write access.

## Execution

The workflow installs locked dependencies, then runs Codex with read-only GitHub permissions. It checks the changed file paths and exports the allowed source changes, including new files and deletions. A fresh job checks out the same starting commit, applies the patch, installs dependencies, and runs headless tests and a production build. Only successful validation enables a separate job with permissions to create a draft PR.

Actions run on GitHub-hosted machines, not the Codex cloud snapshot. Node 10.24.1 supports the legacy Angular application; Node 22 supports Codex. The browser configuration uses the runner's Chrome and writes production outputs outside tracked dist files.

Open Actions → Fleetman issue agent to inspect progress. On success, review the draft PR and agent-summary artifact. On failure, inspect the failed step before removing and readding the label. Labeling is the trigger; changing the board status does not dispatch an agent.

## CI and review

Frontend CI runs on ordinary pull requests and pushes to master. Issue #1 fixed the original six failures; all seven original tests passed. Future behavior changes must retain useful coverage and add or update tests where needed. Do not remove assertions just to make a change pass.

PRs opened using GITHUB_TOKEN do not normally trigger another pull_request workflow. The agent workflow therefore validates before opening the PR. Subsequent human pushes trigger normal PR CI. If branch protection requires Frontend CI, a maintainer must arrange that check to run on the generated PR (for example, close and reopen the PR as a human); do not bypass required checks. A future GitHub App integration can remove this limitation.

Move the issue to In Progress when starting a run; use In Review if your board has that column. The project currently moves closed issues to Done automatically. Merging a PR with its Closes reference closes the linked issue. Other board transitions are not performed by this workflow. Review actual changes and validation before merging; never treat a successful agent summary as proof of CI completion.
