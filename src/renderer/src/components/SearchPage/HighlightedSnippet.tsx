import { useMemo } from 'react';

const HighlightedSnippet = ({ snippet, truncate = true }: { snippet: string; truncate?: boolean }) => {
  const parts = useMemo(() => snippet.split(/<b>|<\/b>/), [snippet]);
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
            className="bg-background-color-3 dark:bg-dark-background-color-3 rounded-sm text-black! dark:text-font-color-black!"
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
