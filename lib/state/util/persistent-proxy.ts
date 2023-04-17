import { proxy, subscribe } from "valtio";

export const persistentProxy = <T extends object>(key: string, defaults: T) => {
  const initialState: T = globalThis.localStorage
    ? JSON.parse(globalThis.localStorage.getItem(key)) || defaults
    : defaults;

  const proxyState = proxy<T>(initialState);

  subscribe(proxyState, () => {
    localStorage.setItem(key, JSON.stringify(proxyState));
  });

  return proxyState;
};
