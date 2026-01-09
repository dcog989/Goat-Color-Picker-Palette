import { getContext, setContext } from 'svelte';
import type { RootStore } from './stores/root.svelte';

const APP_KEY = Symbol('APP_ROOT');

export function setApp(store: RootStore) {
    setContext(APP_KEY, store);
}

export function getApp() {
    return getContext<RootStore>(APP_KEY);
}
