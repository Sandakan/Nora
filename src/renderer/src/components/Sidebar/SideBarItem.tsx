/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable import/prefer-default-export */

interface SideBarItems {
  id: string;
  parentClassName: string;
  icon: string;
  content: string;
  isActive: boolean;
  handleClick: (_id: string) => any;
}

const SideBarItem = (props: SideBarItems) => {
  return (
    <li
      className={`${
        props.parentClassName
      } text-font-color-black/70 hover:bg-background-color-1 dark:text-font-color-white dark:hover:bg-dark-background-color-1 flex !h-12 w-[95%] !min-w-[3rem] cursor-pointer items-center rounded-r-3xl bg-[transparent] pl-4 text-xl font-medium outline-offset-2 transition-[background] duration-300 focus-visible:!outline ${
        props.isActive &&
        'bg-background-color-3! dark:bg-dark-background-color-3! dark:text-font-color-black!'
      } shrink-0 last:mt-auto last:!mb-0 nth-last-2:mb-8`}
      onClick={() => props.handleClick(props.id)}
      onKeyDown={(e) => e.key === 'Enter' && props.handleClick(props.id)}
      tabIndex={0}
    >
      <span className="material-icons-round icon mr-5 text-2xl font-normal!">{props.icon}</span>
      <span>{props.content}</span>
    </li>
  );
};

export default SideBarItem;
