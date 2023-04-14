import { getDefaultStore, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";

export type Migration<A, B> = (state: A) => B;

export const persistentAtom = <T>(opts: {
  key: string;
  initial: T;
  migrations?: Migration<any, T>[];
  store?: ReturnType<typeof getDefaultStore | typeof createStore>;
}) => {
  const parsedStorageValue = tryCatch(
    () => JSON.parse(globalThis.localStorage?.getItem(opts.key)) as T,
  ).unwrapOr(opts.initial);

  const atom = atomWithStorage<T & { __version: number }>(
    opts.key,
    (parsedStorageValue ?? opts.initial) as T & { __version: number },
  );

  const store = opts.store ?? getDefaultStore();
  const initialState = store.get(atom);
  const initialVersion = initialState?.__version ?? 0;
  const nextVersion = opts.migrations?.length ?? 0;

  if (nextVersion > initialVersion) {
    console.group(`state-migration:${opts.key}`);

    const migrations = opts.migrations.slice(initialVersion);

    console.info(`initial [version: ${initialVersion}]`, initialState);

    const newState = migrations.reduce((acc, migration, version) => {
      const nextVersion = initialVersion + version + 1;
      const nextState = { ...migration(acc), __version: nextVersion };

      if (migrations.length == 1 || nextVersion !== 1) {
        const step = version == migrations.length - 1 ? "final" : "next";
        console.info(`${step} [version: ${nextVersion}]`, nextState);
      }

      return nextState;
    }, initialState);

    console.groupEnd();

    store.set(atom, { ...newState, __version: nextVersion });
  }

  return atom;
};
