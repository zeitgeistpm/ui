import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";

import Store from "lib/stores/Store";
import {
  defaultQueryState,
  useMarketsUrlQuery,
} from "lib/hooks/useMarketsUrlQuery";
import { isEmpty } from "lodash";
import { from } from "rxjs";
import { MarketPreloader } from "lib/gql/markets";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<{ store: Store }> = observer(
  ({ children, store }) => {
    const { markets: marketsStore, graphQLClient } = store;
    const query = useMarketsUrlQuery();

    useEffect(() => {
      store.initialize();
    }, []);

    useEffect(() => {
      if (!isEmpty(marketsStore?.markets) || graphQLClient == null) {
        return;
      }

      const preloader = new MarketPreloader(graphQLClient);

      window.performance.mark("MARKETS_GQL_PRELOAD_START");
      const sub = from(preloader.fetchMarkets(query)).subscribe(res => {
        store.setPreloadedMarkets(res);
        window.performance.mark("MARKETS_GQL_PRELOAD_END");
        console.log('Markets preloaded', res);
      });
      return () => sub.unsubscribe();
    }, [query, marketsStore?.markets, graphQLClient]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
