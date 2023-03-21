import { Context, create$, Sdk, ZeitgeistIpfs } from "@zeitgeistpm/sdk-next";
import { endpointOptions as endpoints, graphQlEndpoint } from "lib/constants";
import { memoize } from "lodash-es";
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
  const [sub, setSub] = useState<Subscription>();
  const [sdk, setSdk] = useState<Sdk<Context> | null>();

  const id = identify(
    endpoints.map((e) => e.value),
    graphQlEndpoint,
  );
  const prevId = usePrevious(id);

  useEffect(() => {
    const endpointVals = endpoints.map((e) => e.value);
    if ((id && endpoints) || graphQlEndpoint) {
      if (sub && prevId && id !== prevId) {
        setTimeout(() => {
          init.cache.delete(prevId);
          sub.unsubscribe();
        }, 500);
      }

      const sdk$ = init(endpointVals, graphQlEndpoint);
      //@ts-ignore todo: adjust type in sdk
      const nextSub = sdk$.subscribe(setSdk);

      setSub(nextSub as any);

      return () => {
        setTimeout(() => {
          nextSub.unsubscribe();
        }, 500);
      };
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
  (endpoints: string[], graphQlEndpoint: string) => {
    return create$({
      provider: endpoints,
      indexer: graphQlEndpoint,
      storage: ZeitgeistIpfs(),
    });
  },
  (endpoints, graphQlEndpoint) => identify(endpoints, graphQlEndpoint) ?? "--",
);

/**
 * Generate a key based on store endpoint settings.
 *
 * @param store Store
 * @returns
 */
const identify = (
  endpoints: string[],
  graphQlEndpoint: string,
): string | null => `${endpoints.join(",")}:${graphQlEndpoint}`;
