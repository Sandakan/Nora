/* eslint-disable jsx-a11y/label-has-associated-control */

interface CheckboxProp {
  id: string;
  containerClassName?: string;
  isChecked: boolean;
  checkedStateUpdateFunction: (state: boolean) => void;
  labelContent?: string;
}

const Checkbox = (props: CheckboxProp) => {
  const {
    id,
    checkedStateUpdateFunction,
    isChecked,
    labelContent,
    containerClassName,
  } = props;
  return (
    <div
      className={`checkbox-and-labels-container ${
        containerClassName || id
      }-container`}
    >
      <input
        type="checkbox"
        name={id}
        id={id}
        checked={isChecked}
        onChange={(e) => checkedStateUpdateFunction(e.currentTarget.checked)}
      />
      <label className="checkmark" htmlFor={id}>
        <span className="material-icons-round icon">check</span>
      </label>
      {labelContent && (
        <label htmlFor={id} className="info">
          {labelContent}
        </label>
      )}
    </div>
  );
};

Checkbox.defaultProps = {
  labelContent: false,
  containerClassName: false,
};

export default Checkbox;
