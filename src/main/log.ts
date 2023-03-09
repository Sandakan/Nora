import { app } from 'electron';
import { appendFileSync } from 'fs';
import path from 'path';

interface LogOptions {
  preventLoggingToConsole: boolean;
}

const defaultLogOptions: LogOptions = {
  preventLoggingToConsole: false,
};

type LogMessageTypes = 'INFO' | 'WARN' | 'ERROR';

const objectToString = (obj?: Record<string, unknown>) => {
  if (obj) {
    const str = JSON.stringify(obj);
    return str;
  }
  return '';
};

/** A function that takes two parameters, message and preventLoggingToConsole. */
export default (
  message: Error | string,
  data?: Record<string, unknown>,
  messageType = 'INFO' as LogMessageTypes,
  logOptions?: LogOptions
) => {
  let mes: string;

  if (message instanceof Error) mes = message.message;
  else mes = message.replaceAll('\n', '\n\t');

  const options: LogOptions = { ...defaultLogOptions, ...logOptions };
  const seperator =
    messageType === 'ERROR' ? '======' : messageType === 'WARN' ? '######' : '';

  if (messageType !== 'INFO') mes = mes.toUpperCase();
  const str = `\n[${new Date().toUTCString()}] = ${seperator} ${mes} ${seperator}\n\t${objectToString(
    data
  )}`;
  appendFileSync(path.join(app.getPath('userData'), 'logs.txt'), str, {
    encoding: 'utf-8',
  });

  if (!options.preventLoggingToConsole) console.log(str);
};
