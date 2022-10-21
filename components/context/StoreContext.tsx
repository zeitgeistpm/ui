import React, { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { isEmpty } from "lodash";
import { from } from "rxjs";
import hashObject from "object-hash";

import Store from "lib/stores/Store";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import { MarketPreloader } from "lib/gql/markets-list";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<{ store: Store }> = observer(
  ({ children, store }) => {
    const { markets: marketsStore, graphQLClient } = store;
    const query = useMarketsUrlQuery();

    const [hashedQuery, setHashedQuery] = useState<string>();

    useEffect(() => {
      setHashedQuery(hashObject(query));
    }, [query]);

    useEffect(() => {
      store.initialize();
    }, []);

    useEffect(() => {
      if (!isEmpty(marketsStore?.markets) || graphQLClient == null) {
        return;
      }

      const preloader = new MarketPreloader(graphQLClient);

      const sub = from(preloader.fetchMarkets(query)).subscribe((res) => {
        store.setPreloadedMarkets(res);
      });
      return () => sub.unsubscribe();
    }, [hashedQuery, marketsStore?.markets, graphQLClient]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
