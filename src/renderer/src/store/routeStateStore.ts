import hasDataChanged from '@renderer/utils/hasDataChanged';
import { Store } from '@tanstack/react-store';

export const DEFAULT_ROUTE_STATE_DATA: RouteStates = {
  'lyrics-editor': {
    songId: 0,
    lyrics: []
  }
};

export const routeStateStore = new Store(DEFAULT_ROUTE_STATE_DATA);

export const updateRouteState = <T extends Routes>(route: T, data: RouteStates[T]) =>
  routeStateStore.setState((state) => ({ ...state, [route]: data }));

routeStateStore.subscribe((state) => {
  const modified = hasDataChanged(state.prevVal, state.currentVal);
  const onlyModified = Object.groupBy(
    Object.entries(modified),
    ([, value]) => `${value.isModified}`
  );

  if (window.api.properties.isInDevelopment) {
    console.debug(
      'route store state changed:',
      state.currentVal,
      'modified:',
      onlyModified['true']
    );
  }
});
