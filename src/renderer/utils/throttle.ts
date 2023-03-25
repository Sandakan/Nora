/* eslint-disable no-unused-vars */
const throttle = <Args extends any[]>(
  cb: (...args: Args) => void,
  delay = 1000
) => {
  let shouldWait = false;
  let waitingArgs: any;

  const timeoutFunc = () => {
    if (waitingArgs === null) {
      shouldWait = false;
    } else {
      cb(...waitingArgs);
      waitingArgs = null;
      setTimeout(timeoutFunc, delay);
    }
  };

  return (...args: Args) => {
    if (shouldWait) {
      waitingArgs = args;
      return;
    }

    cb(...args);
    shouldWait = true;

    setTimeout(timeoutFunc, delay);
  };
};

export default throttle;
