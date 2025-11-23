type Props = {
  shortcutKey?: string;
  className?: string;
  children?: string;
};

const ShortcutButton = (props: Props) => {
  const { children, shortcutKey, className } = props;
  return (
    <div
      className={`shortcut-button bg-background-color-3/75 dark:bg-dark-background-color-3/25 rounded-md px-2 py-1 text-center ${className}`}
    >
      {shortcutKey || children}
    </div>
  );
};

export default ShortcutButton;
