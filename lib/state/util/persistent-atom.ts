import { atom, getDefaultStore, createStore } from "jotai";
import { RESET, atomWithStorage } from "jotai/utils";
import { tryCatch, fromNullable } from "@zeitgeistpm/utility/dist/option";
import { isBrowser } from "framer-motion";

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
  migrations?: Migration<any, Versioned<T>>[];
  /**
   * Store to use.
   * @default getDefaultStore()
   */
  store?: ReturnType<typeof getDefaultStore | typeof createStore>;
};

export type Versioned<T> = T & { __version?: number };

/**
 * Migration function to make state changes needed for the next version.
 */
export type Migration<A, B> = (state: A) => B;

/**
 * Create a persistent atom that is stored in localStorage.
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
export const persistentAtom = <T>(opts: PersistentAtomConfig<Versioned<T>>) => {
  const parsedStorageValue = fromNullable(
    globalThis.localStorage?.getItem(opts.key),
  )
    .bind((raw) => tryCatch(() => JSON.parse(raw) as Versioned<T>))
    .unwrapOr(opts.defaultValue);

  const storageAtom = atomWithStorage<Versioned<T>>(
    opts.key,
    parsedStorageValue,
  );

  const store = opts.store ?? getDefaultStore();
  const initialState = store.get(storageAtom);
  const initialVersion = initialState?.__version ?? 0;
  const nextVersion = opts.migrations?.length ?? 0;

  if (nextVersion > initialVersion) {
    let newState = initialState;
    const migrations = opts.migrations?.slice(initialVersion);

    if (migrations) {
      if (isBrowser) {
        console.group(`state-migration:${opts.key}`);
        console.info(`initial [version: ${initialVersion}]`, initialState);
      }

      newState = migrations.reduce((acc, migration, version) => {
        const nextVersion = initialVersion + version + 1;
        const nextState = { ...migration(acc), __version: nextVersion };

        if (migrations.length == 1 || nextVersion !== 1) {
          const step = version == migrations.length - 1 ? "final" : "next";
          if (isBrowser) {
            console.info(`${step} [version: ${nextVersion}]`, nextState);
          }
        }

        return nextState;
      }, initialState);

      if (isBrowser) {
        console.groupEnd();
      }
    }

    newState && store.set(storageAtom, { ...newState, __version: nextVersion });
  }

  const proxy = atom<
    Versioned<T>,
    [
      | Versioned<T>
      | typeof RESET
      | ((prev: Versioned<T>) => Versioned<T> | typeof RESET),
    ],
    void
  >(
    (get) => get(storageAtom),
    (get, set, update) => {
      const version = get(storageAtom).__version ?? 0;
      const nextValue =
        typeof update === "function"
          ? (update as (prev: T) => T | typeof RESET)(get(storageAtom))
          : update;
      if (nextValue === RESET) {
        set(storageAtom, opts.defaultValue);
      } else {
        set(storageAtom, { ...nextValue, __version: version });
      }
    },
  );

  return proxy;
};
