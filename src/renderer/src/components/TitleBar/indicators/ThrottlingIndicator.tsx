// import React from 'react';
// import { AppContext } from '../../contexts/AppContext';
// import useBooleanStateChange from '../../hooks/useBooleanStateChange';

// const ThrottlingIndicator = () => {
//   const { isThrottling } = React.useContext(AppContext);
//   const [isChanging, setChangingState] = useBooleanStateChange(false, 1000);
//   const [isAppThrottling, setIsAppThrottling] = React.useState(false);

//   React.useEffect(() => {
//     setChangingState(isThrottling);
//     if (!isChanging) {
//       setIsAppThrottling(isThrottling);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isChanging, isThrottling]);

//   return (
//     <div
//       className={`throttling-indicator group mr-1 flex cursor-pointer items-center justify-center rounded-md bg-background-color-2 px-3 py-1 text-center transition-[background] dark:bg-dark-background-color-2 ${
//         !isAppThrottling &&
//         'invisible hidden transition-[visibility]! delay-[2500ms] duration-150'
//       }`}
//       title="App is skipping some render cycles to improve performance. Do not edit lyrics when this icon is visible."
//     >
//       <span
//         className={`material-icons-round-outlined py-[2px] leading-none group-hover:text-font-color-highlight dark:group-hover:text-dark-font-color-highlight ${
//           !isAppThrottling &&
//           'invisible text-font-color-highlight opacity-0 transition-[opacity,visibility] delay-[2500ms] duration-200 dark:text-dark-font-color-highlight'
//         }`}
//       >
//         hourglass_empty
//       </span>
//     </div>
//   );
// };

// export default ThrottlingIndicator;
