const log = (
  str: string | Error,
  data?: Record<string, unknown>,
  logToConsoleType: LogMessageTypes = 'INFO',
  forceWindowRestart = false,
  forceMainRestart = false
) => {
  let logType = logToConsoleType;
  let message: typeof str;
  const parsedData: Record<string, unknown> = {};

  if (str instanceof Error) {
    logType = 'ERROR';
    message = str;
  } else message = str;

  if (logType === 'INFO') console.log(message, data);
  if (logType === 'WARN') console.warn(message, data);
  if (logType === 'ERROR') console.error(message, data);

  if (data) {
    for (const [prop, val] of Object.entries(data)) {
      if (val instanceof Error) parsedData[prop] = { ...val };
      else parsedData[prop] = val;
    }
  }

  window.api.log.sendLogs(message, parsedData, logType, forceWindowRestart, forceMainRestart);
};

export default log;
