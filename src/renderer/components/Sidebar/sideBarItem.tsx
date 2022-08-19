/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable import/prefer-default-export */

interface SideBarItems {
  parentClassName: string;
  icon: string;
  content: string;
  handleClick: (id: string) => any;
}

export const SideBarItem = (props: SideBarItems) => {
  return (
    <li
      className={`${props.parentClassName} w-[95%] h-12 text-2xl pl-4 text-font-color-black dark:text-font-color-white mb-2 rounded-r-3xl flex items-center cursor-pointer bg-[transparent] transition-[background] lg:pl-0 lg:justify-center hover:bg-background-color-1 dark:hover:bg-dark-background-color-1 duration-300`}
      onClick={() => props.handleClick(props.content)}
    >
      <span className="material-icons-round icon mr-5 lg:mr-0 text-3xl">
        {props.icon}
      </span>
      <span className="lg:hidden">{props.content}</span>
    </li>
  );
};
