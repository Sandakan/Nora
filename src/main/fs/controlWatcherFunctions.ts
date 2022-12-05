import log from '../log';

const watcherInstances: { path: string; controller: AbortController }[] = [];

export const closeWatcher = (path: string) => {
  for (let i = 0; i < watcherInstances.length; i += 1) {
    const watcherInstance = watcherInstances[i];
    if (watcherInstance.path === path) {
      return watcherInstance.controller.abort();
    }
  }
  return log(
    `Error occurred when trying to close a watcher. Watcher instance not found in watcherInstances array.`,
    { watcherPath: path },
    'ERROR'
  );
};

export const saveWatcherAbortController = (
  path: string,
  controller: AbortController
) => {
  watcherInstances.push({ path, controller });
};
