import { marked } from 'marked';

export function parseChangelog(markdown: string): Changelog {
  const tokens = marked.lexer(markdown);
  const versions: AppVersion[] = [];
  let currentVersion: AppVersion | null = null;
  let currentCategory: keyof ChangelogNoteTypes | null = null;
  let lastSeenArtwork: string | undefined = undefined;
  const topImportantNotes: string[] = [];
  let parsedFirstVersion = false;

  for (const token of tokens) {
    // Capture top blockquote as importantNotes for the latest version
    if (token.type === 'blockquote' && !parsedFirstVersion) {
      // Clean up markdown markers like > [!TIP] or headers
      const rawText = token.text || '';
      const lines = rawText
        .split('\n')
        .map(line => line.replace(/^[>\s#*!-]*\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]\s*/i, '').replace(/<br\s*\/?>/gi, '').trim())
        .filter(line => line.length > 0);
      
      if (lines.length > 0) {
        topImportantNotes.push(lines.join(' '));
      }
      continue;
    }

    // 1. Detect Version Heading: e.g. ## [3.1.0-stable] - 2025-03-29
    if (token.type === 'heading' && token.depth === 2) {
      const match = token.text.match(/\[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
      if (match) {
        parsedFirstVersion = true;
        const vTag = match[1];
        const vDate = match[2] || '';

        // Save previous version first so we can check it for duplication
        if (currentVersion && !versions.includes(currentVersion)) {
          versions.push(currentVersion);
        }

        // Check if version already exists to merge it
        const existing = versions.find(v => v.version === vTag);
        if (existing) {
          currentVersion = existing;
          if (!currentVersion.releaseDate && vDate) {
            currentVersion.releaseDate = vDate;
          }
          if (lastSeenArtwork && !currentVersion.artwork) {
            currentVersion.artwork = lastSeenArtwork;
          }
        } else {
          currentVersion = {
            version: vTag,
            releaseDate: vDate,
            notes: { new: [], fixed: [], knownIssues: [], developerUpdates: [] }
          };
          if (lastSeenArtwork) {
            currentVersion.artwork = lastSeenArtwork;
          }
        }
        lastSeenArtwork = undefined;
        currentCategory = null;
      }
    }

    // Capture last seen artwork image in paragraph tokens
    if (token.type === 'paragraph') {
      const imgToken = token.tokens?.find(t => t.type === 'image');
      if (imgToken && 'href' in imgToken) {
        let href = imgToken.href;
        if (href && !href.startsWith('http') && !href.startsWith('/')) {
          href = '/' + href;
        }
        if (currentVersion) {
          currentVersion.artwork = href;
        } else {
          lastSeenArtwork = href;
        }
      }
    }

    if (!currentVersion) continue;

    // 2. Detect Categories: ### Added, ### Fixed, etc.
    if (token.type === 'heading' && token.depth === 3) {
      const title = token.text.toLowerCase();
      if (title.includes('added')) currentCategory = 'new';
      else if (title.includes('fixed')) currentCategory = 'fixed';
      else if (title.includes('changed')) currentCategory = 'developerUpdates';
      else if (title.includes('known issues')) currentCategory = 'knownIssues';
      else currentCategory = null;
    }

    // 3. Collect List Items
    if (token.type === 'list' && currentCategory) {
      for (const item of token.items) {
        currentVersion.notes[currentCategory].push({ note: item.text.replace(/<br\s*\/?>/gi, '').trim() });
      }
    }
  }

  if (currentVersion && !versions.includes(currentVersion)) {
    versions.push(currentVersion);
  }

  // Ensure latest version structure is returned
  const latestVersion: LatestAppVersion = {
    version: versions[0]?.version || '',
    phase: 'stable',
    releaseDate: versions[0]?.releaseDate || '',
    artwork: versions[0]?.artwork,
    importantNotes: topImportantNotes.length > 0 ? topImportantNotes : undefined
  };

  return {
    latestVersion,
    versions
  };
}
