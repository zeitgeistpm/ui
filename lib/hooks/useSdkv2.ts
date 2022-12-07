import {
  Context,
  create$,
  createStorage,
  MarketMetadata,
  Sdk,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import { IPFS } from "@zeitgeistpm/web3.storage";
import Store, { useStore } from "lib/stores/Store";
import { memoize } from "lodash";
import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { usePrevious } from "./usePrevious";

export type UseSdkv2 = [
  /**
   * The latest instance of the sdk if ready.
   */
  sdk: Sdk<Context> | null,
  /**
   * Id based on store settings. Usefull to pass to queries as root key so that
   * caching is per endpoint settings.
   */
  id: string,
];

/**
 * Use sdkv2, will initialize and memoize if not present for current store settings.
 * Returns existing instance if initialized.
 *
 * @note emitted sdk instance can be either/and/or rpc and indexed sdk instance based on settings.
 *
 * @returns UseSdkv2
 */
export const useSdkv2 = (): UseSdkv2 => {
  const store = useStore();
  const [sub, setSub] = useState<Subscription>();
  const [sdk, setSdk] = useState<Sdk<Context> | null>();

  const id = identify(store);
  const prevId = usePrevious(id);

  useEffect(() => {
    if (store.userStore.endpoint || store.userStore.gqlEndpoint) {
      if (sub && prevId && id !== prevId) {
        sub.unsubscribe();
        init.cache.delete(id);
      }

      const sdk$ = init(store);
      const nextSub = sdk$.subscribe(setSdk);

      setSub(nextSub);

      return () => nextSub.unsubscribe();
    }
  }, [id]);

  return [sdk, id];
};

/**
 * Memoized function for creating the sdk. Memoizes based on store settings.
 *
 * @param store Store
 * @returns MemoizedFunction & Sdk<Context>
 */
const init = memoize(
  (store: Store) => {
    const { endpoint, gqlEndpoint } = store.userStore;
    const isLocalEndpoint =
      endpoint.includes("localhost") || endpoint.includes("127.0.0.1");
    if (isLocalEndpoint) {
      return create$({
        provider: endpoint,
        indexer: gqlEndpoint,
        storage: createStorage<MarketMetadata>(
          IPFS.storage({ node: { url: "http://localhost:5001 " } }),
        ),
      });
    } else {
      return create$({
        provider: endpoint,
        indexer: gqlEndpoint,
        storage: ZeitgeistIpfs(),
      });
    }
  },
  (store) => identify(store),
);

/**
 * Generate a key based on store endpoint settings.
 *
 * @param store Store
 * @returns
 */
const identify = (store: Store): string | null =>
  store.userStore.endpoint || store.userStore.gqlEndpoint
    ? `${store.userStore.endpoint}:${store.userStore.gqlEndpoint}`
    : null;
