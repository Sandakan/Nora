/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/prefer-default-export */
import os from 'os';
import ElectronStore from 'electron-store';

const logStore = new ElectronStore({ name: 'log' });

export const logger = async (error: Error | unknown, isFatal = false) => {
  const data = {
    time: new Date().toUTCString(),
    error:
      typeof error === 'object' && (error as Error).name
        ? {
            name: (error as Error)?.name,
            message: (error as Error).message,
            stack: (error as Error)?.stack,
          }
        : { name: error as string, message: error as string },
  };
  console.log(error);

  const logData: LogData = logStore.store as any;

  if (logData && Object.keys(logData).length > 0) {
    logData.logs.push(data);
    logStore.store = logData as any;
  } else {
    const osData = {
      cpu: os.cpus()[0].model,
      architecture: os.arch(),
      totalMemory: os.totalmem(),
      platform: os.platform(),
      os: os.release(),
    };
    logStore.store = { os: osData, logs: [data] };
  }
  if (isFatal) throw error;
  return undefined;
};
