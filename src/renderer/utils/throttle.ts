/** 
 
The return function should be invoked for throttle effect to work correctly.

Throttling limits the rate at which a function can be executed. It ensures that the function is called at most once within a specified time interval. For example, if a user is scrolling a web page and the page needs to load more data, throttling can be used to limit the frequency of data requests to the server, reducing the server load and preventing excessive data consumption by the client. Throttling can be useful in scenarios where the function being called frequently can cause performance issues, such as event handlers or API calls.

*/

const throttle = <Args extends any[]>(
  cb: (...args: Args) => void,
  delay = 1000,
) => {
  let shouldWait = false;
  let waitingArgs: any;

  const timeoutFunc = () => {
    if (!waitingArgs) {
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
