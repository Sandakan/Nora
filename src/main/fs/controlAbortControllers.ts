import logger from '../logger';

const watcherInstances: { id: string; controller: AbortController }[] = [];

export const closeAbortController = (pathOrId?: string) => {
  for (let i = 0; i < watcherInstances.length; i += 1) {
    const watcherInstance = watcherInstances[i];
    if (watcherInstance.id === pathOrId) {
      return watcherInstance.controller.abort();
    }
  }
  return logger.warn(
    `Failed to close a watcher. Watcher instance not found in watcherInstances array.`,
    { watcherPath: pathOrId }
  );
};

export const closeAllAbortControllers = () => {
  const abortControllerIds = watcherInstances.map((instance) => instance.id);
  for (let i = 0; i < watcherInstances.length; i += 1) {
    const watcherInstance = watcherInstances[i];
    watcherInstance.controller.abort();
  }
  return logger.debug(`Closed all abort controllers successfully.`, {
    closedAbortControllerIds: abortControllerIds
  });
};

export const saveAbortController = (IdOrPath: string, controller: AbortController) => {
  watcherInstances.push({ id: IdOrPath, controller });
};
