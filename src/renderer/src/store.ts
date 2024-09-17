import { Store } from '@tanstack/store';
import {
  AppReducerStateActions,
  DEFAULT_REDUCER_DATA,
  reducer as appReducer
} from './other/appReducer';

export const store = new Store(DEFAULT_REDUCER_DATA);

export const dispatch = (options: AppReducerStateActions) => {
  store.setState((state) => {
    return appReducer(state, options);
  });
};

export const reducer = () => {
  return { state: store.state, dispatch };
};
