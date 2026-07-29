---
name: changelog-entry
description: Guide for creating a new entry in CHANGELOG.md following Keep a Changelog 1.1.0 conventions. Use when asked to document changes, add a version release, or edit CHANGELOG.md.
---

This skill guides you through the process of adding a new entry to `CHANGELOG.md` in the Nora project. The project adheres to the [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) format.

## Overview of Keep a Changelog 1.1.0

The changelog tracks changes chronologically in reverse order (newest at the top) and groups changes under descriptive category sections.

### Key Rules
1. **ISO 8601 Date Format**: Version dates must use the `YYYY-MM-DD` format.
2. **Bracketed Version Header**: The version header must be formatted as `## [Version] - YYYY-MM-DD`.
3. **Artwork Image**: If a version release artwork is available, embed it as a Markdown image directly below the version header.
4. **Standard Categories**: Group changes into standard, capitalized subheadings:
   - `### Added` for new features.
   - `### Fixed` for bug fixes.
   - `### Changed` for changes in existing functionality (e.g. refactoring, dependency updates).
   - `### Removed` for features that were removed.
   - `### Deprecated` for soon-to-be-removed features.
   - `### Security` in case of vulnerabilities.
   - `### Known Issues` (Custom category used in Nora to list unresolved bugs).
5. **No empty headers**: Do not include subheadings if there are no changes in that category.
6. **Compare Links**: Add a GitHub comparison link at the bottom of the file comparing the new version with the previous version.

---

## Step-by-Step Guide to Adding a New Version

### Step 1: Open CHANGELOG.md
Open `CHANGELOG.md` in the root of the project.

### Step 2: Insert the Version Header
Locate the top version header (below the introduction block and the tip note). Insert your new version header:

```markdown
## [3.2.0-stable] - 2026-06-13

![Nora v3.2.0-stable version artwork](resources/other/release%20artworks/whats-new-v3.2.0-stable.webp)

### Added
- Added support for dynamic changelog parsing in the app.

### Fixed
- Fixed an issue where the sidebar icons were misaligned.
```

### Step 3: Add Comparison Link at the Bottom
Go to the bottom of `CHANGELOG.md` and add the comparison link in alphabetical/version order:

```markdown
[3.2.0-stable]: https://github.com/Sandakan/Nora/compare/v3.1.0-stable...v3.2.0-stable
```

Update the previous version's comparison link to point to the version before it if needed, ensuring the comparison chain is unbroken.

---

## Verification

After updating the changelog, run the project's formatting verification to ensure everything is correct:

```bash
npm run format-write
npm run format-check
```

This will invoke `oxfmt` to format the Markdown file and ensure it meets style standards.
