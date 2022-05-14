/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-inner-declarations */
declare module 'simple-get' {
  function concat(
    url: string,
    callback: (err: Error | null, res: any, data: Buffer) => any
  ): Record<string, unknown>;
}
