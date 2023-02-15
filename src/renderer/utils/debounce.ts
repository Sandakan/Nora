let timeoutId: NodeJS.Timeout | null = null;

const debounce = (func: () => void, delay: number) => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  timeoutId = setTimeout(func, delay);
};

export default debounce;
