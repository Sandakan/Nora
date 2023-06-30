type Props = {
  shortcutKey: string;
  className?: string;
};

const ShortcutButton = (props: Props) => {
  const { shortcutKey, className } = props;
  return (
    <div
      className={`shortcut-button mr-2 rounded-md bg-background-color-3/75 px-2 py-1 text-center dark:bg-dark-background-color-3/25 ${className}`}
    >
      {shortcutKey}
    </div>
  );
};

export default ShortcutButton;
