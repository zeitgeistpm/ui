import { Context, create$, Sdk, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import { useStore } from "lib/stores/Store";
import { useEffect, useState } from "react";

export const useSdkv2 = () => {
  const store = useStore();

  const [sdk, setSdk] = useState<Sdk<Context> | null>(null);

  useEffect(() => {
    if (store.userStore.endpoint && store.userStore.gqlEndpoint) {
      const sdk$ = create$({
        provider: store.userStore.endpoint,
        indexer: store.userStore.gqlEndpoint,
        storage: ZeitgeistIpfs(),
      });
      const sub = sdk$.subscribe(setSdk);
      return () => sub.unsubscribe();
    }
  }, [store.userStore.endpoint, store.userStore.gqlEndpoint]);

  return sdk;
};
