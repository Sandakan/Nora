import logger from '../logger';

const watcherInstances: { id: string; controller: AbortController }[] = [];

// Extra cleanup callbacks (e.g. clearing a watcher's debounce timer) that must
// run when the corresponding watcher is closed. Kept separate so the abort
// controller registry stays focused on signal wiring.
const watcherCleanups: { id: string; cleanup: () => void }[] = [];

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
  runCleanups(pathOrId);
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
  runCleanupsByPrefix(prefix);
  return closed;
};

export const closeAllAbortControllers = () => {
  const abortControllerIds = watcherInstances.map((instance) => instance.id);
  for (let i = watcherInstances.length - 1; i >= 0; i -= 1) {
    watcherInstances[i].controller.abort();
  }
  watcherInstances.length = 0;
  runAllCleanups();
  return logger.debug(`Closed all abort controllers successfully.`, {
    closedAbortControllerIds: abortControllerIds
  });
};

export const saveAbortController = (IdOrPath: string, controller: AbortController) => {
  watcherInstances.push({ id: IdOrPath, controller });
};

export const registerWatcherCleanup = (id: string, cleanup: () => void) => {
  watcherCleanups.push({ id, cleanup });
};

const runCleanups = (id?: string) => {
  for (let i = watcherCleanups.length - 1; i >= 0; i -= 1) {
    if (watcherCleanups[i].id === id) {
      watcherCleanups[i].cleanup();
      watcherCleanups.splice(i, 1);
    }
  }
};

const runCleanupsByPrefix = (prefix: string) => {
  for (let i = watcherCleanups.length - 1; i >= 0; i -= 1) {
    if (watcherCleanups[i].id.startsWith(prefix)) {
      watcherCleanups[i].cleanup();
      watcherCleanups.splice(i, 1);
    }
  }
};

const runAllCleanups = () => {
  for (const entry of watcherCleanups) {
    entry.cleanup();
  }
  watcherCleanups.length = 0;
};
