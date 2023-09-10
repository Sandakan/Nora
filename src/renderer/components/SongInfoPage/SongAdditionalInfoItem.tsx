type Props = {
  label: string;
  value: string;
};

const SongAdditionalInfoItem = (props: Props) => {
  const { label, value } = props;

  return (
    <div className="mb-2 rounded-md first:mt-2 p-2 last:mb-0 odd:bg-background-color-1/25 hover:odd:bg-background-color-1/50 even:hover:bg-background-color-1/50 dark:odd:bg-dark-background-color-1/25 dark:hover:odd:bg-dark-background-color-1/50 dark:even:hover:bg-dark-background-color-1/50">
      <p className="text-sm text-font-color-highlight dark:text-dark-font-color-highlight">
        {label}
      </p>
      <p className="pl-2">{value}</p>
    </div>
  );
};

export default SongAdditionalInfoItem;
