let timeoutId: NodeJS.Timeout | null = null;

/* 

Debouncing, on the other hand, is used to ensure that a function is called only after a certain period of time has elapsed since the last time it was called. This is useful in scenarios where a function is triggered by events that happen frequently, such as key presses or scroll events. By debouncing the function, it is ensured that it is only called once after the user has stopped typing or scrolling, reducing the number of times the function is called and improving performance.

*/

const debounce = (func: () => void, delay: number) => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  timeoutId = setTimeout(func, delay);
};

export default debounce;
