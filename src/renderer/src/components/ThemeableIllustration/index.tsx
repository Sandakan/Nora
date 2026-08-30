import type { FC, SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement> & {
  illustration: FC<SVGProps<SVGSVGElement> & { title?: string }>;
};

const ThemeableIllustration = ({ illustration: Illustration, className = '', ...props }: Props) => {
  return (
    <span
      className={`text-illustration-accent dark:text-dark-illustration-accent ${className}`}
      style={{ color: 'hsl(var(--illustration-accent-color))' }}
    >
      <Illustration {...props} />
    </span>
  );
};

export default ThemeableIllustration;
