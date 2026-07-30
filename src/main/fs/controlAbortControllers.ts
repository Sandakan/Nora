import logger from '../logger';

const watcherInstances: { id: string; controller: AbortController }[] = [];

export const closeAbortController = (pathOrId?: string) => {
  let closed = 0;
  for (let i = watcherInstances.length - 1; i >= 0; i -= 1) {
    const watcherInstance = watcherInstances[i];
    if (watcherInstance.id === pathOrId) {
      watcherInstance.controller.abort();
      watcherInstances.splice(i, 1);
      closed += 1;
    }
  }
  if (closed === 0) {
    logger.warn(
      `Failed to close a watcher. Watcher instance not found in watcherInstances array.`,
      { watcherPath: pathOrId }
    );
  }
  return closed;
};

export const closeAbortControllersByPrefix = (prefix: string) => {
  let closed = 0;
  for (let i = watcherInstances.length - 1; i >= 0; i -= 1) {
    const watcherInstance = watcherInstances[i];
    if (watcherInstance.id.startsWith(prefix)) {
      watcherInstance.controller.abort();
      watcherInstances.splice(i, 1);
      closed += 1;
    }
  }
  return closed;
};

export const closeAllAbortControllers = () => {
  const abortControllerIds = watcherInstances.map((instance) => instance.id);
  for (let i = watcherInstances.length - 1; i >= 0; i -= 1) {
    watcherInstances[i].controller.abort();
  }
  watcherInstances.length = 0;
  return logger.debug(`Closed all abort controllers successfully.`, {
    closedAbortControllerIds: abortControllerIds
  });
};

export const saveAbortController = (IdOrPath: string, controller: AbortController) => {
  watcherInstances.push({ id: IdOrPath, controller });
};
