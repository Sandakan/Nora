import Img from '../Img';

interface NoLyricsProp {
  content: string;
  artworkPath: string;
}

const NoLyrics = (props: NoLyricsProp) => {
  const { artworkPath, content } = props;
  return (
    <div className="no-lyrics-container flex flex-col items-center justify-center text-center text-3xl text-[#ccc]">
      <Img src={artworkPath} className="mb-8 w-60" alt="" />
      {content}
    </div>
  );
};

export default NoLyrics;
