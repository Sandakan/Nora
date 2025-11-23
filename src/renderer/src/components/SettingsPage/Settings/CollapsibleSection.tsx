import { useState, type ReactNode, type KeyboardEvent } from "react";

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") setOpen((o) => !o);
  };

  return (
    <div className="secondary-container mb-4 rounded-4xl border border-background-color-2 dark:border-dark-background-color-2">

      <div
        tabIndex={0}
        className="flex cursor-pointer select-none items-center rounded-4xl justify-between p-4 outline-offset-2 hover:bg-background-color-2 dark:hover:bg-dark-background-color-2"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKey}
      >
        <span className="font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          {title}
        </span>

        <span className="material-icons-round-outlined text-xl text-font-color-highlight">
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
