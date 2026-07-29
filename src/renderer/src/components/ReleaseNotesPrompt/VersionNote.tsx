import { useId } from 'react';

import Img from '../Img';
import Hyperlink from '../Hyperlink';

export interface VersionNoteProps {
  note: string;
  artworkPath?: string;
}

export const parseBold = (text: string) => {
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const elements: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    const [_, boldText] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      elements.push(text.substring(lastIndex, matchIndex));
    }

    elements.push(
      <strong key={`bold-${matchIndex}`} className="text-font-color-highlight dark:text-dark-font-color-highlight font-semibold">
        {boldText}
      </strong>
    );

    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
};

export const parseMarkdownLinks = (text: string) => {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [_, linkText, url] = match;
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const precedingText = text.substring(lastIndex, matchIndex);
      const parsed = parseBold(precedingText);
      if (Array.isArray(parsed)) {
        elements.push(...parsed);
      } else {
        elements.push(parsed);
      }
    }

    const parsedLinkText = parseBold(linkText);
    const linkChildren = Array.isArray(parsedLinkText) ? <>{parsedLinkText}</> : parsedLinkText;

    elements.push(
      <Hyperlink key={`${url}-${matchIndex}`} link={url}>
        {linkChildren}
      </Hyperlink>
    );

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    const parsed = parseBold(remainingText);
    if (Array.isArray(parsed)) {
      elements.push(...parsed);
    } else {
      elements.push(parsed);
    }
  }

  return elements.length > 0 ? elements : parseBold(text);
};

const VersionNote = (props: VersionNoteProps) => {
  const { note, artworkPath } = props;
  const key = useId();
  return (
    <li className="mb-1 font-normal last:mb-4 dark:font-light" key={key}>
      {parseMarkdownLinks(note)}
      {artworkPath && (
        <>
          <br />
          <Img src={artworkPath} noFallbacks className="mx-auto my-4 w-[80%] max-w-full" alt="" />
        </>
      )}
    </li>
  );
};

export default VersionNote;
