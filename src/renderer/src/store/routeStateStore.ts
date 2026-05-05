import hasDataChanged from '@renderer/utils/hasDataChanged';
import { Store } from '@tanstack/react-store';

type RouteStateSubscriptionState =
  | RouteStates
  | {
      currentVal?: RouteStates;
      prevVal?: RouteStates;
    };

const getSubscriptionState = (state: RouteStateSubscriptionState) => {
  if ('currentVal' in state && 'prevVal' in state) {
    return {
      currentVal: state.currentVal || DEFAULT_ROUTE_STATE_DATA,
      prevVal: state.prevVal || DEFAULT_ROUTE_STATE_DATA
    };
  }

  return {
    currentVal: state,
    prevVal: DEFAULT_ROUTE_STATE_DATA
  };
};

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
  const { prevVal, currentVal } = getSubscriptionState(state as RouteStateSubscriptionState);
  const modified = hasDataChanged(prevVal, currentVal);
  const onlyModified = Object.groupBy(
    Object.entries(modified),
    ([, value]) => `${value.isModified}`
  );

  if (window.api.properties.isInDevelopment) {
    console.debug('route store state changed:', currentVal, 'modified:', onlyModified['true']);
  }
});
