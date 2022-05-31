import React from 'react';

interface ButtonProps {
  label: string;
  iconName?: string;
  className?: string;
  clickHandler: (
    e:
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
      | React.KeyboardEvent<HTMLButtonElement>
  ) => void;
}

const Button = (props: ButtonProps) => {
  const { className, iconName, label, clickHandler } = props;
  return (
    <button
      type="button"
      className={`button ${className}`}
      onClick={(e) => clickHandler(e)}
      onKeyDown={(e) => clickHandler(e)}
    >
      <span className="material-icons-round icon">{iconName}</span> {label}
    </button>
  );
};

Button.defaultProps = {
  className: '',
  iconName: '',
};

export default Button;
