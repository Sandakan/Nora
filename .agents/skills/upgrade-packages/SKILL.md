---
name: upgrade-packages
description: >-
  Workflow for auditing, assessing feasibility, upgrading, and verifying npm and Rust Cargo
  dependencies in Nora. Use when checking for outdated packages, upgrading dependencies in
  package.json or audio-engine/Cargo.toml, or resolving peer-dependency and breaking-change issues.
---

# Upgrade Packages

This skill defines the end-to-end workflow for auditing and upgrading **npm** (`package.json`) and **Rust Cargo** (`audio-engine/Cargo.toml`) dependencies in Nora.

## 1. Discovery & Dry-Run Check

1. Run the combined outdated check from the repository root:
   ```bash
   npm run outdated
   ```
   - `outdated:npm` runs `npm outdated`.
   - `outdated:cargo` runs `cargo update --manifest-path audio-engine/Cargo.toml --dry-run --verbose`.
2. Run a dry-run for npm updates to surface peer-dependency conflicts and lockfile changes before modifying any files:
   ```bash
   npm update --dry-run
   # Or, for specific major/minor target versions:
   npm install <pkg>@<version> --dry-run
   ```
   - Note: On Windows, network-bound `npm` and `cargo` commands require running outside the sandbox (`BypassSandbox: true`).

## 2. Feasibility Assessment & User Approval

For each outdated npm package or Cargo crate:

1. **Inspect usages & type shims** in the codebase:
   ```bash
   git grep -n "<package-or-crate>"
   ```
   Check `src/types/` for manual `.d.ts` shims that may become obsolete or conflict with updated upstream types.
2. **Check compatibility constraints**:
   - **npm**: Inspect `package-lock.json` or run `npm view <pkg> peerDependencies` (e.g., `@vitejs/plugin-react` constraining `oxc-transform-react`).
   - **Cargo**: Check `rustc --version` against any updated crate's MSRV (e.g., `souvlaki`) and review feature flags in `audio-engine/Cargo.toml`.
3. **Check changelogs / breaking changes** for major bumps, `0.x` bumps, or deep-import changes.
4. **Present a feasibility table** classifying each candidate as:
   - **Safe / Drop-in**
   - **Feasible w/ Refactor** (note required code/type changes)
   - **Blocked (PeerDep / MSRV)** (note the constraining package/version)
5. **Ask the user for explicit approval** before running `npm install` or editing `package.json`, `audio-engine/Cargo.toml`, or `audio-engine/Cargo.lock`.

## 3. Apply Approved Updates

### npm (`package.json`)

1. Update approved version ranges in `package.json` and run:
   ```bash
   npm install
   ```
2. Apply any required code or TypeScript refactors (e.g., replacing removed deep imports or fixing stricter type signatures).
3. If `oxfmt` was updated and `npm run format-check` reports diffs, run `npm run format` so CI/husky formatting stays green.

### Rust Cargo (`audio-engine/`)

1. Update direct dependency versions in `audio-engine/Cargo.toml` for approved major or `0.x` bumps.
2. Update the lockfile and fetch crates:
   ```bash
   cargo update --manifest-path audio-engine/Cargo.toml
   cargo fetch --manifest-path audio-engine/Cargo.toml
   ```

## 4. Verification

Run the full verification suite after all edits:

1. **TypeScript, Lint, Format & Unit Tests**:
   ```bash
   npm run typecheck
   npm run lint
   npm run format-check
   npm test
   ```
2. **Rust Audio Engine** (whenever Cargo dependencies were modified):
   ```bash
   cargo test --manifest-path audio-engine/Cargo.toml
   npm run build:engine:debug
   ```
3. **Platform Application Build** (run the script matching the host OS):
   - Windows: `npm run build:win`
   - macOS: `npm run build:mac`
   - Linux: `npm run build:linux`

## 5. Post-Upgrade `CHANGELOG.md` Prompt

Once all verification checks pass, use `ask_question` to ask the user what to add to `CHANGELOG.md` (following the `changelog-entry` skill conventions under `### Changed`), offering concise suggested entries and always including a final option to **Skip `CHANGELOG.md` update**.
