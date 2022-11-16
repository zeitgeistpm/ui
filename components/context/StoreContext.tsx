import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { from } from "rxjs";
import hashObject from "object-hash";

import Store from "lib/stores/Store";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import { MarketsListPagiantor } from "lib/gql/markets-list";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<{ store: Store }> = observer(
  ({ children, store }) => {
    const { markets: marketsStore, graphQLClient, userStore } = store;
    const query = useMarketsUrlQuery();
    const address = userStore.accountAddress;

    const [hashedQuery, setHashedQuery] = useState<string>();

    useEffect(() => {
      setHashedQuery(hashObject(query));
    }, [query]);

    useEffect(() => {
      store.initialize();
    }, []);

    useEffect(() => {
      if (marketsStore.initialPageLoaded === true || graphQLClient == null) {
        return;
      }

      const preloader = new MarketsListPagiantor(graphQLClient);

      const sub = from(preloader.fetchMarkets(query, address)).subscribe(
        (res) => {
          store.setPreloadedMarkets(res);
        },
      );
      return () => sub.unsubscribe();
    }, [hashedQuery, marketsStore.initialPageLoaded, graphQLClient]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
