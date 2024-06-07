import { useId } from 'react';
import Img from '../Img';

export interface VersionNoteProps {
  note: string;
  artworkPath?: string;
}

const VersionNote = (props: VersionNoteProps) => {
  const { note, artworkPath } = props;
  const key = useId();
  return (
    <li className="mb-1 font-normal last:mb-4 dark:font-light" key={key}>
      {note}
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
