interface CurrentLocationContainerProps {
  href: string;
}

const CurrentLocationContainer = ({ href }: CurrentLocationContainerProps) => {
  return (
    <div className="text-font-color-dimmed dark:text-dark-font-color-dimmed text-sm">{href}</div>
  );
};

export default CurrentLocationContainer;
