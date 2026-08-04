import { useMemo } from 'react';

const HighlightedSnippet = ({
  snippet,
  truncate = true
}: {
  snippet: string;
  truncate?: boolean;
}) => {
  // Split on the SOH (u0001) / STX (u0002) markers emitted by ts_headline.
  // Split by character code, not a regex, so the project's no-control-regex
  // lint rule is not violated.
  const parts = useMemo(() => {
    const result: string[] = [];
    let current = '';
    let isHighlight = false;
    for (const char of snippet) {
      const code = char.codePointAt(0);
      if (code === 0x0001 || code === 0x0002) {
        result.push(current);
        current = '';
        isHighlight = !isHighlight;
      } else {
        current += char;
      }
    }
    if (current.length > 0 || snippet.endsWith('\u0001') || snippet.endsWith('\u0002')) {
      result.push(current);
    }
    return result;
  }, [snippet]);
  // Odd indices are the highlighted segments (they follow an opening marker).
  const highlightedIndices = useMemo(() => {
    const indices = new Set<number>();
    for (let i = 1; i < parts.length; i += 2) indices.add(i);
    return indices;
  }, [parts.length]);

  return (
    <div
      className={`lyric-snippet text-font-color-highlight/70 dark:text-dark-font-color-highlight/70 mt-1 max-w-full text-sm italic ${
        truncate ? 'truncate' : ''
      }`}
    >
      {parts.map((part, index) =>
        highlightedIndices.has(index) ? (
          <mark
            key={`hl-${index}-${part}`}
            className="bg-background-color-3 dark:bg-dark-background-color-3 dark:text-font-color-black! rounded-sm text-black!"
          >
            {part}
          </mark>
        ) : (
          <span key={`tx-${index}-${part}`}>{part}</span>
        )
      )}
    </div>
  );
};

export default HighlightedSnippet;
