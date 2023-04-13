import { getDefaultStore, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";

export type PersistentAtomConfig<T> = {
  /**
   * Storage key
   */
  key: string;
  /**
   * Default value if no value is stored.
   */
  defaultValue: T;
  /**
   * Migrations to run on the stored value.
   * @note index is used as version number.
   * @warning when adding migrations all previous migrations in the list will have to left in place.
   */
  migrations?: Migration<any, T>[];
  /**
   * Store to use.
   * @default getDefaultStore()
   */
  store?: ReturnType<typeof getDefaultStore | typeof createStore>;
};

/**
 * Migration function to make state changes needed for the next version.
 */
export type Migration<A, B> = (state: A) => B;

/**
 * Create a persisten atom that is stored in localStorage.
 *
 * Has some improvements over the default atomWithStorage where the
 * stored value is readable and writable right after initialization.
 *
 * And supports migrations.
 *
 * @warning when adding migrations all previous migrations in the list will have to left in place.
 *
 * @param opts PersistentAtomConfig
 * @returns WritableAtom<T & {__version: number}
 */
export const persistentAtom = <T>(opts: PersistentAtomConfig<T>) => {
  const parsedStorageValue = tryCatch(
    () => JSON.parse(globalThis.localStorage?.getItem(opts.key)) as T,
  ).unwrapOr(opts.defaultValue);

  const atom = atomWithStorage<T & { __version: number }>(
    opts.key,
    (parsedStorageValue ?? opts.defaultValue) as T & { __version: number },
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
