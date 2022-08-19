/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */

interface ResultFilterProp {
  filterType: string;
  isCurrentActiveFilter: boolean;
  changeActiveFilter: (filterType: SearchFilters) => void;
}

export const ResultFilter = (props: ResultFilterProp) => {
  return (
    <li
      className={`appear-from-bottom ${
        props.isCurrentActiveFilter && 'active'
      }`}
      onClick={() =>
        props.changeActiveFilter(props.filterType as SearchFilters)
      }
    >
      {props.filterType}
    </li>
  );
};
