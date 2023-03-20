import {
  Context,
  create$,
  createStorage,
  MarketMetadata,
  Sdk,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import { IPFS } from "@zeitgeistpm/web3.storage";
import { endpointOptions, graphQlEndpoint } from "lib/constants";
import { memoize } from "lodash-es";
import { useEffect, useState } from "react";
import { Subscription } from "rxjs";
import { usePrevious } from "./usePrevious";
import { useEndpointSettings } from "lib/state/endpointSettings";

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
  const { endpoint } = useEndpointSettings();
  const [sub, setSub] = useState<Subscription>();
  const [sdk, setSdk] = useState<Sdk<Context> | null>();

  const id = identify(endpoint, graphQlEndpoint);
  const prevId = usePrevious(id);

  useEffect(() => {
    if ((id && endpoint) || graphQlEndpoint) {
      if (sub && prevId && id !== prevId) {
        setTimeout(() => {
          init.cache.delete(prevId);
          sub.unsubscribe();
        }, 500);
      }

      const sdk$ = init(endpoint, graphQlEndpoint);
      //@ts-ignore todo: adjust type in sdk
      const nextSub = sdk$.subscribe(setSdk);

      setSub(nextSub);

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
  (endpoint: string, graphQlEndpoint: string) => {
    const isLocalEndpoint =
      endpoint.includes("localhost") || endpoint.includes("127.0.0.1");
    if (isLocalEndpoint) {
      return create$({
        provider: endpoint,
        indexer: graphQlEndpoint,
        storage: createStorage<MarketMetadata>(
          IPFS.storage({ node: { url: "http://localhost:5001 " } }),
        ),
      });
    } else {
      const backupRPCs = endpointOptions
        .filter((ep) => ep.value !== endpoint)
        .map((e) => e.value);

      return create$({
        provider: [endpoint, ...backupRPCs],
        indexer: graphQlEndpoint,
        storage: ZeitgeistIpfs(),
      });
    }
  },
  (endpoint, graphQlEndpoint) => identify(endpoint, graphQlEndpoint) ?? "--",
);

/**
 * Generate a key based on store endpoint settings.
 *
 * @param store Store
 * @returns
 */
const identify = (endpoint: string, graphQlEndpoint: string): string | null =>
  endpoint || graphQlEndpoint ? `${endpoint}:${graphQlEndpoint}` : null;
