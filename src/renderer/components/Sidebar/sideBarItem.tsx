/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable import/prefer-default-export */

interface SideBarItems {
  parentClassName: string;
  icon: string;
  content: string;
  isActive: boolean;
  handleClick: (id: string) => any;
}

const SideBarItem = (props: SideBarItems) => {
  return (
    <li
      className={`${
        props.parentClassName
      } mb-2 flex h-12 w-[95%] cursor-pointer items-center rounded-r-3xl bg-[transparent] pl-4 text-2xl text-font-color-black transition-[background] duration-300 hover:bg-background-color-1 dark:text-font-color-white dark:hover:bg-dark-background-color-1 ${
        props.isActive &&
        '!bg-background-color-3 !text-font-color-black dark:!bg-dark-background-color-3 dark:!text-font-color-black'
      }`}
      onClick={() => props.handleClick(props.content)}
    >
      <span className="material-icons-round icon mr-5 text-3xl">
        {props.icon}
      </span>
      <span>{props.content}</span>
    </li>
  );
};

export default SideBarItem;
