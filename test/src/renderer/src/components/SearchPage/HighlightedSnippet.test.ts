import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HighlightedSnippet from '../../../../../../src/renderer/src/components/SearchPage/HighlightedSnippet';

const SOH = String.fromCharCode(0x01);
const STX = String.fromCharCode(0x02);

const renderHtml = (snippet: string) =>
  renderToStaticMarkup(createElement(HighlightedSnippet, { snippet, truncate: false }));

describe('HighlightedSnippet', () => {
  it('renders matched lyric text in a <mark> when SOH/STX markers are present', () => {
    const html = renderHtml(`the rain in${SOH}spain${STX}falls mainly`);
    expect(html).toContain('<mark');
    expect(html).toContain('spain');
    expect(html).toContain('the rain in');
    expect(html).toContain('falls mainly');
  });

  it('renders plain text without markers as a span', () => {
    const html = renderHtml('no match here');
    expect(html).not.toContain('<mark');
    expect(html).toContain('no match here');
  });

  it('handles a snippet that ends on an opening marker without throwing', () => {
    const html = renderHtml(`ends with match${SOH}spain`);
    expect(html).toContain('<mark');
    expect(html).toContain('spain');
  });
});
