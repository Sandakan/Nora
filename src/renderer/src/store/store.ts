import { Store } from '@tanstack/store';
import { cloneDeep } from 'es-toolkit/object';

import {
	type AppReducer,
	type AppReducerStateActions,
	DEFAULT_REDUCER_DATA,
	reducer as appReducer,
} from '../other/appReducer';
import storage from '../utils/localStorage';
// import hasDataChanged from '../utils/hasDataChanged';

storage.checkLocalStorage();
export const store = new Store(DEFAULT_REDUCER_DATA);

type StoreSubscriptionState =
	| AppReducer
	| {
			currentVal?: AppReducer;
			prevVal?: AppReducer;
	  };

const getCurrentStoreState = (subscriptionState: StoreSubscriptionState): AppReducer => {
	if ('currentVal' in subscriptionState && subscriptionState.currentVal) {
		return subscriptionState.currentVal;
	}

	return subscriptionState as AppReducer;
};

export const dispatch = (options: AppReducerStateActions) => {
	store.setState((state) => {
		return appReducer(state, options);
	});
};

export const reducer = () => {
	return { state: store.state, dispatch };
};

dispatch({
	type: 'UPDATE_LOCAL_STORAGE',
	data: storage.getLocalStorage(),
});

store.subscribe((state) => {
	const currentState = getCurrentStoreState(state as StoreSubscriptionState);

	if (!currentState?.localStorage) {
		return;
	}

	storage.setLocalStorage(currentState.localStorage);

	// const modified = hasDataChanged(state.prevVal, state.currentVal);
	// const onlyModified = Object.groupBy(
	//   Object.entries(modified),
	//   ([, value]) => `${value.isModified}`
	// );

	if (window.api.properties.isInDevelopment) {
		console.debug('store state changed:', cloneDeep(currentState));
	}
});
