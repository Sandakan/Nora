import { app } from 'electron';
import { appendFileSync } from 'fs';
import path from 'path';
import { sendMessageToRenderer } from './main';
import { makeDirSync } from './utils/makeDir';

const IS_DEVELOPMENT =
  !app.isPackaged || process.env.NODE_ENV === 'development';
export interface LogOptions {
  preventLoggingToConsole?: boolean;
  sendToRenderer?:
    | boolean
    | MessageCodes
    | {
        code?: MessageCodes;
        data?: Object;
      };
}

const defaultLogOptions: LogOptions = {
  preventLoggingToConsole: false,
};

export type LogMessageTypes = 'INFO' | 'WARN' | 'ERROR';

const objectToString = (obj?: Record<string, unknown>) => {
  if (obj) {
    for (const x of Object.keys(obj)) {
      const property = obj[x];
      if (property instanceof Error) {
        obj[x] = `${property.message}\r${property.stack}`;
      }
    }

    const str = JSON.stringify(obj);
    return str;
  }
  return '';
};

const getMinTwoWidthNums = (num: number) => {
  if (num >= 10) return num.toString();
  return `0${num}`;
};

const getLogFilePath = () => {
  const logSaveFolder = path.join(app.getPath('userData'), 'logs');

  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const formattedDate = `${year}-${getMinTwoWidthNums(
    month
  )}-${getMinTwoWidthNums(day)}`;

  const appState = IS_DEVELOPMENT ? 'dev' : 'prod';
  const logFileName = `${formattedDate}.${appState}.log.txt`;

  makeDirSync(logSaveFolder);

  const logFilePath = path.join(logSaveFolder, logFileName);
  return logFilePath;
};

export const logFilePath = getLogFilePath();

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

  if (options.sendToRenderer) {
    const rendererMsgOptions = {
      code: (messageType === 'INFO' ? 'INFO' : 'FAILURE') as MessageCodes,
      data: undefined as Object | undefined,
    };

    if (typeof options.sendToRenderer === 'object') {
      const { code, data: rendererData } = options.sendToRenderer;

      if (code) rendererMsgOptions.code = code;
      rendererMsgOptions.data = rendererData;
    }
    if (typeof options.sendToRenderer === 'string')
      rendererMsgOptions.code = options.sendToRenderer;

    sendMessageToRenderer(
      mes,
      rendererMsgOptions.code,
      rendererMsgOptions.data
    );
  }

  if (messageType !== 'INFO') mes = mes.toUpperCase();
  const str = `\n[${new Date().toUTCString()}] = ${seperator} ${mes} ${seperator}\n\t${objectToString(
    data
  )}`;
  appendFileSync(logFilePath, str, { encoding: 'utf-8' });

  if (!options?.preventLoggingToConsole) console.log(str);
};
