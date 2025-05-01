import { createLink, type LinkComponent, type LinkComponentProps } from '@tanstack/react-router';
import { forwardRef } from 'react';

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}
export type NavLinkProps = LinkComponentProps<typeof NavLinkComponent>;

const NavLinkComponent = forwardRef<HTMLAnchorElement, Props>((props, ref) => (
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  <a ref={ref} {...props} className={` ${props.className}`} />
));

const CreatedLinkComponent = createLink(NavLinkComponent);

/**
 * A NavLink component that wraps a Link component from @tanstack/react-router.
 * It applies styling to make it look like a navigation link.
 * @param props Props to pass to the underlying Link component.
 * @returns A NavLink component that wraps a Link component.
 *
 * Use `[&.active]` in tailwind to style the active link.
 */
const NavLink: LinkComponent<typeof NavLinkComponent> = (props) => {
  return <CreatedLinkComponent preload={'intent'} {...props} />;
};

export default NavLink;
