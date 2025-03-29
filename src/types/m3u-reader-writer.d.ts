declare module 'm3u8-reader' {
  export default function (input: Buffer): M3uData;
}

type M3uData = unknown[];
