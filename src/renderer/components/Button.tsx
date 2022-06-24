import React from 'react';

interface ButtonProps {
  label?: string;
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
      {iconName && (
        <span className="material-icons-round icon">{iconName}</span>
      )}
      {label && <span className="button-label-text">{label}</span>}
    </button>
  );
};

Button.defaultProps = {
  className: undefined,
  iconName: '',
  label: undefined,
};

export default Button;
