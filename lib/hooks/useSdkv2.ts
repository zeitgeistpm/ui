import { Context, create$, Sdk, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import Store, { useStore } from "lib/stores/Store";
import { memoize } from "lodash";
import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { usePrevious } from "./usePrevious";

const init = memoize(
  (store: Store) => {
    return create$({
      provider: store.userStore.endpoint,
      indexer: store.userStore.gqlEndpoint,
      storage: ZeitgeistIpfs(),
    });
  },
  (store) => sdkKey(store),
);

const sdkKey = (store: Store): string | null =>
  store.userStore.endpoint || store.userStore.gqlEndpoint
    ? `${store.userStore.endpoint}:${store.userStore.gqlEndpoint}`
    : null;

export const useSdkv2 = (): [Sdk<Context> | null, string] => {
  const store = useStore();
  const [sub, setSub] = useState<Subscription>();
  const [sdk, setSdk] = useState<Sdk<Context> | null>();

  const id = sdkKey(store);
  const prevId = usePrevious(id);

  useEffect(() => {
    if (store.userStore.endpoint || store.userStore.gqlEndpoint) {
      if (sub && prevId && id !== prevId) {
        sub.unsubscribe();
      }

      const sdk$ = init(store);

      const nextSub = sdk$.subscribe(setSdk);
      setSub(nextSub);
      return () => nextSub.unsubscribe();
    }
  }, [id]);

  return [sdk, id];
};
