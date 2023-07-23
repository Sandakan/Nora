/* eslint-disable no-useless-escape */
import os from 'os';
import childProcess from 'node:child_process';
import path from 'path';

import log from '../log';

// using the comman > wmic logicaldisk get Name, Size, FreeSpace
const winRootRegex =
  /^(?<freeSpace>\d+) {0,}(?<name>\w+:) {0,}(?<size>\d+) {0,}$/gm;

// uses the command > df -h
const linuxRootRegex =
  /^(?<name>[\w\/-]+) *(?<size>[\d.]+)(?<sizeType>[A-Z]?) *(?<used>[\d.]+)(?<usedType>[A-Z]?) *(?<avail>[\d.]+)(?<availType>[A-Z]?) *(?<useInPercent>[\d.]+)% *(?<mountedOn>[\w\/-]+)$/gm;

type DataType = 'B' | 'M' | 'G' | 'T';
const convertToBytes = (val: number, dataType: DataType = 'B') => {
  if (dataType === 'T') return val * 2 ** 40;
  if (dataType === 'G') return val * 2 ** 30;
  if (dataType === 'M') return val * 2 ** 20;
  return val;
};

const getRootSize = (
  appPath: string,
): Promise<{ freeSpace: number; size: number }> =>
  new Promise((resolve, reject) => {
    try {
      const output = { freeSpace: 0, size: 0 };
      const platform = os.platform();

      if (platform === 'win32') {
        const { root } = path.parse(appPath);
        const rootDir = root.replaceAll(path.sep, '');
        childProcess.execFile(
          'cmd.exe',
          ['/c', 'wmic logicaldisk get Name, Size, FreeSpace'],
          (error, stdout) => {
            if (error) {
              reject(new Error(`exec error: ${error}`));
            }

            const drives = stdout.matchAll(winRootRegex);
            for (const drive of drives) {
              const { groups } = drive;
              if (
                groups &&
                'name' in groups &&
                groups.name === rootDir &&
                'freeSpace' in groups &&
                'size' in groups
              ) {
                output.size = parseInt(groups.size);
                output.freeSpace = parseInt(groups.freeSpace);
                return resolve(output);
              }
            }
            return resolve(output);
          },
        );
      } else if (platform === 'linux')
        childProcess.execFile(
          '/bin/sh',
          [`-c`, `df -h "${appPath}"`],
          (error, stdout) => {
            if (error) {
              reject(new Error(`exec error: ${error}`));
            }

            const drives = stdout.matchAll(linuxRootRegex);
            for (const drive of drives) {
              const { groups } = drive;
              if (
                groups &&
                'name' in groups &&
                'size' in groups &&
                'sizeType' in groups &&
                'avail' in groups &&
                'availType' in groups
              ) {
                output.size = convertToBytes(
                  parseInt(groups.size),
                  groups.sizeType as DataType,
                );
                output.freeSpace = convertToBytes(
                  parseInt(groups.avail),
                  groups.availType as DataType,
                );
                return resolve(output);
              }
            }
            return resolve(output);
          },
        );
      else log(`No support for getting root size in ${platform}.`);
    } catch (error) {
      log('Error occurred when calculating root size', { error }, 'ERROR');
      reject(error);
    }
  });

export default getRootSize;
