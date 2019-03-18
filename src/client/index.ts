import { createBrowserHistory } from 'history';
import { GlobalState } from '../utils/global-state-class';

const priStore = (window as any)['pri'];

const globalState: GlobalState = priStore.globalState;

export const history = createBrowserHistory({
  basename: globalState.projectConfig.baseHref
});

export const isDevelopment = globalState.isDevelopment;

export const projectConfig = globalState.projectConfig;

export type ProjectConfig = typeof projectConfig;
