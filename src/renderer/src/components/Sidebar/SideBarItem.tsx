import NavLink, { type NavLinkProps } from '../NavLink';

interface SideBarItems extends NavLinkProps {
  parentClassName: string;
  icon: string;
  content: string;
}

const SideBarItem = (props: SideBarItems) => {
  const { parentClassName, icon, content, className } = props;

  return (
    <NavLink
      {...props}
      className={`${
        parentClassName
      } ${className} text-font-color-black/70 hover:bg-background-color-1 dark:text-font-color-white dark:hover:bg-dark-background-color-1 [&.active]:bg-background-color-3! dark:[&.active]:bg-dark-background-color-3! dark:[&.active]:text-font-color-black! flex !h-12 w-[95%] !min-w-[3rem] shrink-0 cursor-pointer items-center rounded-r-3xl bg-[transparent] pl-4 text-xl font-medium outline-offset-2 transition-[background] duration-300 last:mt-auto last:!mb-0 focus-visible:!outline nth-last-2:mb-8`}
    >
      <span className="material-icons-round icon mr-5 text-2xl font-normal!">{icon}</span>
      <span>{content}</span>
    </NavLink>
  );
};

export default SideBarItem;
