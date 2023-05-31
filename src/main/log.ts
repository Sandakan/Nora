import { app } from 'electron';
import { appendFileSync } from 'fs';
import path from 'path';
import { sendMessageToRenderer } from './main';

interface LogOptions {
  preventLoggingToConsole?: boolean;
  sendToRenderer?:
    | boolean
    | {
        code?: MessageCodes;
        data?: Object;
      };
}

const defaultLogOptions: LogOptions = {
  preventLoggingToConsole: false,
};

type LogMessageTypes = 'INFO' | 'WARN' | 'ERROR';

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
      code: undefined as MessageCodes | undefined,
      data: undefined as Object | undefined,
    };

    if (typeof options.sendToRenderer !== 'boolean') {
      const { code, data: rendererData } = options.sendToRenderer;

      rendererMsgOptions.code = code;
      rendererMsgOptions.data = rendererData;
    }

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
  appendFileSync(path.join(app.getPath('userData'), 'logs.txt'), str, {
    encoding: 'utf-8',
  });

  if (!options?.preventLoggingToConsole) console.log(str);
};
