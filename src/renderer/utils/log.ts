const log = (
  str: string | Error,
  logToConsoleType: 'log' | 'warn' | 'error' = 'log',
  forceWindowRestart = false,
  forceMainRestart = false
) => {
  let logType = logToConsoleType;
  let message: string;

  if (str instanceof Error) {
    logType = 'error';
    message = str.message;
  } else message = str;

  if (logType) console[logToConsoleType](log);

  window.api.log.sendLogs(
    message,
    logType,
    forceWindowRestart,
    forceMainRestart
  );
};

export default log;
