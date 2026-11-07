type Props = {
  label: string;
  value: string;
  tooltip?: string;
  technicalLabel?: string;
};

const SongAdditionalInfoItem = (props: Props) => {
  const { label, value, tooltip, technicalLabel } = props;

  const titleText =
    tooltip && technicalLabel
      ? `${technicalLabel} — ${tooltip}`
      : (tooltip ?? technicalLabel);

  return (
    <div className="odd:bg-background-color-1/25 hover:odd:bg-background-color-1/50 even:hover:bg-background-color-1/50 dark:odd:bg-dark-background-color-1/25 dark:hover:odd:bg-dark-background-color-1/50 dark:even:hover:bg-dark-background-color-1/50 mb-2 rounded-md p-2 first:mt-2 last:mb-0">
      <div className="flex items-center">
        <p className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
          {label}
        </p>
        {titleText && (
          <span
            className="material-icons-round-outlined text-font-color-highlight/70 dark:text-dark-font-color-highlight/70 hover:text-font-color-highlight dark:hover:text-dark-font-color-highlight ml-1.5 cursor-help text-base leading-none transition-colors"
            title={titleText}
          >
            info
          </span>
        )}
      </div>
      <p className="pl-2">{value}</p>
    </div>
  );
};

export default SongAdditionalInfoItem;
