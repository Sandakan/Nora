/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */

import ElectronStore from 'electron-store';

const logStore = new ElectronStore({ name: 'log' });

export const logger = async (error: Error, isFatal = false) => {
  const data = {
    time: new Date().toUTCString(),
    error: { name: error?.name, message: error.message, stack: error?.stack },
  };
  console.log(error);

  const logData: LogData = logStore.store as any;

  if (logData && Object.keys(logData).length > 0) {
    logData.logs.push(data);
    logStore.store = logData as any;
  } else {
    logStore.store = { logs: [data] };
  }
  if (isFatal) throw error;
  return undefined;
};
