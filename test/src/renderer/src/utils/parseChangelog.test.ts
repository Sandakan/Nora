import { describe, it, expect } from 'vitest';
import { parseChangelog } from '../../../../../src/renderer/src/utils/parseChangelog';

describe('parseChangelog', () => {
  it('should parse standard Keep a Changelog Markdown correctly', () => {
    const markdown = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> [!TIP]
> This is a tip/important note for the latest version.

## [3.1.0-stable] - 2025-03-29

![Nora v3.1.0-stable version artwork](resources/other/artwork.webp)

### Added
- Added feature A.
- Added feature B.

### Fixed
- Fixed bug X.

### Changed
- Refactored logic.

### Known Issues
- Problem with commas.
`;

    const changelog = parseChangelog(markdown);

    // Verify latestVersion
    expect(changelog.latestVersion.version).toBe('3.1.0-stable');
    expect(changelog.latestVersion.releaseDate).toBe('2025-03-29');
    expect(changelog.latestVersion.artwork).toBe('/resources/other/artwork.webp');
    expect(changelog.latestVersion.importantNotes).toEqual([
      'This is a tip/important note for the latest version.'
    ]);

    // Verify versions list
    expect(changelog.versions).toHaveLength(1);
    const v = changelog.versions[0];
    expect(v.version).toBe('3.1.0-stable');
    expect(v.releaseDate).toBe('2025-03-29');
    expect(v.artwork).toBe('/resources/other/artwork.webp');
    expect(v.notes.new).toEqual([{ note: 'Added feature A.' }, { note: 'Added feature B.' }]);
    expect(v.notes.fixed).toEqual([{ note: 'Fixed bug X.' }]);
    expect(v.notes.developerUpdates).toEqual([{ note: 'Refactored logic.' }]);
    expect(v.notes.knownIssues).toEqual([{ note: 'Problem with commas.' }]);
  });

  it('should merge duplicate version tags correctly', () => {
    const markdown = `## [0.5.0-alpha] - 2022-05-25

### Added
- Added feature C.

## [0.5.0-alpha] - 2022-05-25

### Fixed
- Fixed bug Y.
`;

    const changelog = parseChangelog(markdown);
    expect(changelog.versions).toHaveLength(1);
    const v = changelog.versions[0];
    expect(v.version).toBe('0.5.0-alpha');
    expect(v.notes.new).toEqual([{ note: 'Added feature C.' }]);
    expect(v.notes.fixed).toEqual([{ note: 'Fixed bug Y.' }]);
  });

  it('should handle empty/missing input gracefully', () => {
    const changelog = parseChangelog('');
    expect(changelog.latestVersion.version).toBe('');
    expect(changelog.versions).toHaveLength(0);
  });

  it('should parse versions without a release date', () => {
    const markdown = `## [unreleased-version]

### Added
- Feature X.
`;
    const changelog = parseChangelog(markdown);
    expect(changelog.versions).toHaveLength(1);
    const v = changelog.versions[0];
    expect(v.version).toBe('unreleased-version');
    expect(v.releaseDate).toBe('');
  });

  it('should normalize relative and absolute artwork image paths correctly', () => {
    const markdown = `## [1.0.0] - 2025-01-01

![Absolute](https://example.com/art.png)

![Relative No Slash](assets/art.webp)

![Relative With Slash](/assets/art2.webp)
`;
    const changelog = parseChangelog(markdown);
    expect(changelog.versions).toHaveLength(1);
    // Since it overrides currentVersion.artwork, only the last seen one is kept
    expect(changelog.versions[0].artwork).toBe('/assets/art2.webp');

    // Test first image is parsed correctly
    const markdown2 = `## [1.0.0] - 2025-01-01

![Absolute](https://example.com/art.png)
`;
    const changelog2 = parseChangelog(markdown2);
    expect(changelog2.versions[0].artwork).toBe('https://example.com/art.png');

    const markdown3 = `## [1.0.0] - 2025-01-01

![Relative No Slash](assets/art.webp)
`;
    const changelog3 = parseChangelog(markdown3);
    expect(changelog3.versions[0].artwork).toBe('/assets/art.webp');
  });

  it('should only capture top-level blockquotes as importantNotes and ignore blockquotes under version headers', () => {
    const markdown = `> [!IMPORTANT]
> Global announcement.

## [1.0.0] - 2025-01-01

> This is a blockquote inside version 1.0.0.

### Added
- Feature.
`;
    const changelog = parseChangelog(markdown);
    expect(changelog.latestVersion.importantNotes).toEqual(['Global announcement.']);
  });

  it('should ignore unrecognized list items or categories', () => {
    const markdown = `## [1.0.0] - 2025-01-01

### Unrecognized Category
- Some random item.

### Fixed
- A fix.
`;
    const changelog = parseChangelog(markdown);
    expect(changelog.versions[0].notes.fixed).toEqual([{ note: 'A fix.' }]);
    // Checking that unrecognized categories do not populate standard notes
    expect(changelog.versions[0].notes.new).toEqual([]);
    expect(changelog.versions[0].notes.knownIssues).toEqual([]);
    expect(changelog.versions[0].notes.developerUpdates).toEqual([]);
  });

  it('should strip br tags from blockquotes and note items', () => {
    const markdown = `> [!NOTE]
> Important note.<br>With line.

## [1.0.0] - 2025-01-01

### Added
- Item with br tag.<br/>
- Item with another br tag.<br>
`;
    const changelog = parseChangelog(markdown);
    expect(changelog.latestVersion.importantNotes).toEqual(['Important note.With line.']);
    expect(changelog.versions[0].notes.new).toEqual([
      { note: 'Item with br tag.' },
      { note: 'Item with another br tag.' }
    ]);
  });
});
