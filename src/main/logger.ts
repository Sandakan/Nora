import path from 'path';
import { app } from 'electron';
import winston from 'winston';
// import { sendMessageToRenderer } from './main';

const IS_DEVELOPMENT = app?.isPackaged || process.env.NODE_ENV === 'development';

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
  const logSaveFolder = path?.join(app?.getPath('userData'), 'logs');

  const date = new Date();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const formattedDate = `${year}-${getMinTwoWidthNums(month)}-${getMinTwoWidthNums(day)}`;

  const appState = IS_DEVELOPMENT ? 'dev' : 'prod';
  const logFileName = `${formattedDate}.${appState}.log.txt`;

  const logFilePath = path?.join(logSaveFolder, logFileName);
  return logFilePath;
};

export const logFilePath = getLogFilePath();

const DEFAULT_LOGGER_LEVEL = IS_DEVELOPMENT ? 'silly' : 'info';

const transports = {
  console: new winston.transports.Console({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD hh:mm:ss.SSS A'
      }),
      winston.format.json({ deterministic: true }),
      winston.format.colorize({ all: true }),
      winston.format.simple()
    )
  }),
  file: new winston.transports.File({
    level: DEFAULT_LOGGER_LEVEL,
    filename: logFilePath
  })
};

const log = winston.createLogger({
  transports: [transports.console, transports.file]
});
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

export const toggleVerboseLogs = (isEnabled: boolean) => {
  // Object.values(transports).forEach((transport) => {
  //   if (isEnabled) {
  //     transport.level = 'verbose';
  //   } else {
  //     transport.level = DEFAULT_LOGGER_LEVEL;
  //   }
  // });
  if (isEnabled) {
    transports.console.level = 'debug';
    transports.file.level = 'debug';
  } else {
    transports.console.level = DEFAULT_LOGGER_LEVEL;
    transports.file.level = DEFAULT_LOGGER_LEVEL;
  }
};

const logger = {
  info: (message: string, data = {} as object) => {
    log.info(message, { process: 'MAIN', data });
  },
  error: (message: string, data = {} as object, error?: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    log.error(message, { process: 'MAIN', error: errorMessage, data });
  },
  warn: (message: string, data = {} as object) => {
    log.warn(message, { process: 'MAIN', data });
  },
  debug: (message: string, data = {} as object) => {
    log.debug(message, { process: 'MAIN', data });
  },
  verbose: (message: string, data = {} as object) => {
    log.verbose(message, { process: 'MAIN', data });
  }
};

export default logger;
