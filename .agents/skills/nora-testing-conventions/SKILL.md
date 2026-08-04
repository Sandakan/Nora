# Nora Testing Conventions

> **Establishing consistent test file organization and structure for the Nora Music Player project.**

## Overview

This skill defines the testing conventions for Nora to ensure consistency, maintainability, and clear organization of test files across the codebase.

## Core Principles

1. **Mirror Source Structure**: Test files must mirror the source directory structure
2. **One Test File Per Source File**: Each test file tests exactly one source file
3. **Clear Naming**: Test files use the same name as the source file with `.test.ts` suffix
4. **Integration Tests**: Separate directory for tests that span multiple files

## Directory Structure Mapping

### Source to Test Mapping

**Pattern**: `src/{path}/{file}.ts` → `test/src/{path}/{file}.test.ts`

**Examples**:

| Source File                                        | Test File                                                    |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `src/main/fs/getParentFolderPaths.ts`              | `test/src/main/fs/getParentFolderPaths.test.ts`              |
| `src/main/filesystem.ts`                           | `test/src/main/filesystem.test.ts`                           |
| `src/main/fs/parseFolderStructuresForSongPaths.ts` | `test/src/main/fs/parseFolderStructuresForSongPaths.test.ts` |
| `src/renderer/src/utils/helpers.ts`                | `test/src/renderer/src/utils/helpers.test.ts`                |
| `src/common/parseLyrics.ts`                        | `test/src/common/parseLyrics.test.ts`                        |

### Current Test Directory Structure

```
test/
├── setup.ts                                          # Vitest setup
├── assets/                                           # Test fixtures and data
├── integration/                                      # Full integration tests
├── src/
│   ├── common/                                       # Tests for src/common/
│   │   └── parseLyrics.test.ts
│   ├── main/
│   │   ├── fs/                                       # Tests for src/main/fs/
│   │   │   ├── getParentFolderPaths.test.ts
│   │   │   ├── parseFolderStructuresForSongPaths.test.ts
│   │   │   └── ...
│   │   ├── filesystem.test.ts                        # Tests for src/main/filesystem.ts
│   │   ├── ipc.test.ts                               # Tests for src/main/ipc.ts
│   │   └── ...
│   ├── renderer/
│   │   └── src/
│   │       ├── utils/
│   │       │   └── helpers.test.ts
│   │       ├── hooks/
│   │       │   └── useAudioPlayer.test.ts
│   │       └── ...
│   └── types/                                        # (if testing type definitions)
└── integration/                                      # Cross-file integration tests
    ├── pathHandling.test.ts                          # Filesystem operations end-to-end
    ├── libraryManagement.test.ts                     # Multi-file library workflows
    └── ...
```

## Test File Organization Guidelines

### Single Source File Tests

**Rule**: Each test file tests **exactly one** source file.

```typescript
// ✅ CORRECT: test/src/main/fs/getParentFolderPaths.test.ts
// Tests ONLY: src/main/fs/getParentFolderPaths.ts

import { describe, it, expect } from 'vitest';
import { getParentFolderPaths } from '@main/fs/getParentFolderPaths';

describe('getParentFolderPaths', () => {
  it('should handle single absolute path', () => {
    // ...
  });
});
```

### Integration Tests (Multiple Source Files)

**Location**: `test/integration/` or `test/src/{area}/` with `.integration.test.ts` suffix

**Rule**: Tests interactions between multiple source files

```typescript
// ✅ CORRECT: test/integration/pathHandling.test.ts
// Tests: Interactions between getParentFolderPaths, filesystem, fs.watch(), etc.

import { describe, it, expect } from 'vitest';
import { getParentFolderPaths } from '@main/fs/getParentFolderPaths';
import { ensureWatched } from '@main/fs/addWatchersToParentFolders';

describe('Filesystem Path Handling Integration', () => {
  it('should watch parent folders of added music paths', () => {
    // Tests interaction between multiple modules
  });
});
```

## Test File Creation Checklist

When creating a new test file:

- [ ] Source file identified: `src/{path}/{file}.ts`
- [ ] Test directory created: `test/src/{path}/`
- [ ] Test file created: `test/src/{path}/{file}.test.ts`
- [ ] Only one source file being tested
- [ ] Imports from the single source file
- [ ] Top-level `describe()` block names the module
- [ ] No imports from other test files
- [ ] File follows Vitest patterns documented in project

## Test File Naming

| Scenario                  | Pattern                             | Example                            |
| ------------------------- | ----------------------------------- | ---------------------------------- |
| Unit test for single file | `{filename}.test.ts`                | `getParentFolderPaths.test.ts`     |
| Integration test          | `{feature}.integration.test.ts`     | `pathHandling.integration.test.ts` |
| Edge case variations      | `{filename}.test.ts` (in same file) | Add multiple describe blocks       |

## Common Mistakes to Avoid

❌ **Multiple Source Files in One Test**

```typescript
// WRONG: Testing two files in one test file
describe('Filesystem utilities', () => {
  describe('getParentFolderPaths', () => {
    /* ... */
  });
  describe('parseFolderStructures', () => {
    /* ... */
  });
});
```

✅ **Separate Test Files**

```typescript
// CORRECT: Each file has its own test
// test/src/main/fs/getParentFolderPaths.test.ts
describe('getParentFolderPaths', () => {
  /* ... */
});

// test/src/main/fs/parseFolderStructuresForSongPaths.test.ts
describe('parseFolderStructuresForSongPaths', () => {
  /* ... */
});
```

❌ **Wrong Directory Structure**

```
test/
├── pathHandling.test.ts  // WRONG: Should be in test/src/main/fs/
├── filesystemUtils.test.ts  // WRONG: Should be in test/src/main/
```

✅ **Correct Directory Structure**

```
test/
├── src/
│   └── main/
│       ├── fs/
│       │   └── getParentFolderPaths.test.ts
│       └── filesystem.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests for specific directory
npm test test/src/main/fs/

# Run single test file
npm test test/src/main/fs/getParentFolderPaths.test.ts

# Run integration tests
npm test test/integration/

# Run with coverage
npm run coverage
```

## Related Documentation

- **Nora copilot-instructions.md**: Main project architecture and patterns
- **TanStack Query Patterns Skill**: Data fetching conventions
- **Vitest Configuration**: `vitest.config.ts` in project root

## Examples by Module

### Main Process Tests (`test/src/main/`)

```typescript
// test/src/main/fs/getParentFolderPaths.test.ts
import { describe, it, expect } from 'vitest';
import { getParentFolderPaths } from '@main/fs/getParentFolderPaths';

describe('getParentFolderPaths', () => {
  describe('absolute paths', () => {
    it('should preserve leading slash', () => {
      const result = getParentFolderPaths(['/home/music']);
      expect(result[0].startsWith('/')).toBe(true);
    });
  });
});
```

### Renderer Tests (`test/src/renderer/`)

```typescript
// test/src/renderer/src/hooks/useAudioPlayer.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '@renderer/hooks/useAudioPlayer';

describe('useAudioPlayer', () => {
  it('should initialize player', () => {
    const { result } = renderHook(() => useAudioPlayer());
    expect(result.current).toBeDefined();
  });
});
```

### Common Module Tests (`test/src/common/`)

```typescript
// test/src/common/parseLyrics.test.ts
import { describe, it, expect } from 'vitest';
import { parseLyrics } from '@common/parseLyrics';

describe('parseLyrics', () => {
  it('should detect synced lyrics', () => {
    const result = parseLyrics('[00:12.00]Line 1');
    expect(result.isSynced).toBe(true);
  });
});
```

## Integration Test Guidelines

Place integration tests in `test/integration/` when:

- Testing interactions between 2+ source modules
- Testing end-to-end workflows
- Testing IPC communication
- Testing file system operations with multiple watchers

```typescript
// test/integration/fileWatching.test.ts
// Tests: getParentFolderPaths + addWatchersToParentFolders + fs.watch()
```

## Maintenance

When refactoring source files:

1. Ensure test file path matches new source path
2. Update imports if module moves
3. Keep test file 1:1 with source file
4. Move tests to integration/ if they now need multiple files

---

**Status**: Active convention for Nora v4.0.0+  
**Last Updated**: 2026-05-02
