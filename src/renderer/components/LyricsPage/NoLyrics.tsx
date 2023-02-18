import Img from '../Img';

interface NoLyricsProp {
  content: string;
  artworkPath: string;
}

const NoLyrics = (props: NoLyricsProp) => {
  const { artworkPath, content } = props;
  return (
    <div className="no-lyrics-container flex flex-col items-center justify-center text-center text-xl text-font-color-dimmed dark:text-dark-font-color-dimmed">
      <Img src={artworkPath} className="mb-8 w-52" alt="" />
      <p className="max-w-[60%]">{content}</p>
    </div>
  );
};

export default NoLyrics;
