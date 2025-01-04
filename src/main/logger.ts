import path from 'path';
import { app } from 'electron';
// import { sendMessageToRenderer } from './main';
import { makeDirSync } from './utils/makeDir';
import pino from 'pino';
import { PinoPretty } from 'pino-pretty';
import { createWriteStream } from 'fs';

const IS_DEVELOPMENT = !app.isPackaged || process.env.NODE_ENV === 'development';

export interface LogOptions {
  preventLoggingToConsole?: boolean;
  sendToRenderer?: MessageToRendererProps;
}

// type LogType = 'MAIN' | 'UI';

// const defaultLogOptions: LogOptions = {
//   preventLoggingToConsole: false
// };

export type LogMessageTypes = 'INFO' | 'WARN' | 'ERROR';

// const objectToString = (obj?: Record<string, unknown>) => {
//   if (obj) {
//     for (const x of Object.keys(obj)) {
//       const property = obj[x];
//       if (property instanceof Error) {
//         obj[x] = `${property.message}\r${property.stack}`;
//       }
//     }

//     const str = JSON.stringify(obj);
//     return str;
//   }
//   return '';
// };

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
  const formattedDate = `${year}-${getMinTwoWidthNums(month)}-${getMinTwoWidthNums(day)}`;

  const appState = IS_DEVELOPMENT ? 'dev' : 'prod';
  const logFileName = `${formattedDate}.${appState}.log.txt`;

  makeDirSync(logSaveFolder);

  const logFilePath = path.join(logSaveFolder, logFileName);
  return logFilePath;
};

export const logFilePath = getLogFilePath();
const streams = [{ stream: createWriteStream(logFilePath) }, { stream: PinoPretty() }];
const pinoLogger = pino(
  {
    base: undefined,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  pino.multistream(streams)
);
const mainLogger = pinoLogger.child({ process: 'MAIN' });
// const rendererLogger = pinoLogger.child({ process: 'UI' });

// const log = (
//   message: Error | string,
//   data?: Record<string, unknown>,
//   messageType: LogMessageTypes = 'INFO',
//   logOptions?: LogOptions,
//   logType: LogType = 'MAIN'
// ) => {
//   let mes: string;

//   if (message instanceof Error) mes = message.message;
//   else mes = message.replaceAll('\n', '\n\t');

//   const options: LogOptions = { ...defaultLogOptions, ...logOptions };

//   if (options.sendToRenderer) sendMessageToRenderer(options.sendToRenderer);

//   if (messageType !== 'INFO') mes = mes.toUpperCase();
//   const str = `\n[${new Date().toUTCString()}] [${logType}] = ${mes}\n\t${objectToString(data)}`;
//   // appendFileSync(logFilePath, str, { encoding: 'utf-8' });

//   if (!options?.preventLoggingToConsole) {
//     if (messageType === 'ERROR') pinoLogger.error(str);
//     else if (messageType === 'WARN') pinoLogger.warn(str);
//     else pinoLogger.info(str);
//   }
// };

const logger = {
  info: (message: string, data = {} as object) => mainLogger.info(data, message),
  error: (message: string, data = {} as object) => {
    mainLogger.error(data, message);
    return (options?: { throwNewError: boolean; errorMessage?: string }) => {
      if (options) {
        if (options.throwNewError) throw new Error(message ?? options.errorMessage);
      }
    };
  },
  warn: (message: string, data = {} as object) => mainLogger.warn(data, message),
  debug: (message: string, data = {} as object) => mainLogger.debug(data, message),
  fatal: (message: string, data = {} as object) => mainLogger.fatal(data, message),
  trace: (message: string, data = {} as object) => mainLogger.trace(data, message)
};

export default logger;
