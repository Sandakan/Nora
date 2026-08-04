interface CurrentLocationContainerProps {
  href: string;
  className?: string;
}

const CurrentLocationContainer = ({ href, className = '' }: CurrentLocationContainerProps) => {
  return (
    <div className={`text-font-color-dimmed dark:text-dark-font-color-dimmed text-sm ${className}`}>
      {href}
    </div>
  );
};

export default CurrentLocationContainer;
