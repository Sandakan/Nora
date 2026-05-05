type Props = {
  label: string;
  value: string;
};

const SongAdditionalInfoItem = (props: Props) => {
  const { label, value } = props;

  return (
    <div className="odd:bg-background-color-1/25 hover:odd:bg-background-color-1/50 even:hover:bg-background-color-1/50 dark:odd:bg-dark-background-color-1/25 dark:hover:odd:bg-dark-background-color-1/50 dark:even:hover:bg-dark-background-color-1/50 mb-2 rounded-md p-2 first:mt-2 last:mb-0">
      <p className="text-font-color-highlight dark:text-dark-font-color-highlight text-sm">
        {label}
      </p>
      <p className="pl-2">{value}</p>
    </div>
  );
};

export default SongAdditionalInfoItem;
