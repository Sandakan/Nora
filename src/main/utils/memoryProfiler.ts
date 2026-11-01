import logger from '../logger';

export function logMemoryCheckpoint(checkpointName: string): void {
  const usage = process.memoryUsage();
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
  logger.info(
    `[Memory Checkpoint] ${checkpointName} -> ` +
      `RSS: ${toMB(usage.rss)} MB | ` +
      `Heap: ${toMB(usage.heapUsed)}/${toMB(usage.heapTotal)} MB | ` +
      `External: ${toMB(usage.external)} MB | ` +
      `ArrayBuffers: ${toMB(usage.arrayBuffers)} MB`
  );
}

export default logMemoryCheckpoint;
