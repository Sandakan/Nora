import { app } from 'electron';
import { appendFileSync } from 'fs';
import path from 'path';

/** A function that takes two parameters, message and preventLoggingToConsole. */
export default (message: string, preventLoggingToConsole = false) => {
  const str = `\n[${new Date().toUTCString()}] = ${message.replaceAll(
    '\n',
    '\n\t'
  )}`;
  appendFileSync(path.join(app.getPath('userData'), 'logs.txt'), str, {
    encoding: 'utf-8',
  });

  // eslint-disable-next-line no-console
  if (!preventLoggingToConsole) console.log(str);
};
