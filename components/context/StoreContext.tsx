import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";
import { isEmpty } from "lodash";
import hashObject from "object-hash";
import { from } from "rxjs";
import { useDebounce } from "use-debounce";

import Store from "lib/stores/Store";
import {
  useMarketsUrlQuery,
} from "lib/hooks/useMarketsUrlQuery";
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

      console.log(query);
      const preloader = new MarketPreloader(graphQLClient);

      const sub = from(preloader.fetchMarkets(query)).subscribe((res) => {
        store.setPreloadedMarkets(res);
      });
      return () => sub.unsubscribe();
    }, [query, marketsStore?.markets, graphQLClient]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
