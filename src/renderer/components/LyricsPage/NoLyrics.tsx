import Img from '../Img';

interface NoLyricsProp {
  content: string;
  artworkPath: string;
}

const NoLyrics = (props: NoLyricsProp) => {
  const { artworkPath, content } = props;
  return (
    <div className="no-lyrics-container flex h-full flex-col items-center justify-center text-center text-xl text-font-color-black dark:text-font-color-white">
      <Img src={artworkPath} className="mb-8 w-52" alt="" />
      <p className="max-w-[70%]">{content}</p>
    </div>
  );
};

export default NoLyrics;
