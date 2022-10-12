import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";

import Store from "lib/stores/Store";
import {
  defaultQueryState,
  useMarketsUrlQuery,
} from "lib/hooks/useMarketsUrlQuery";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<{ store: Store }> = observer(
  ({ children, store }) => {
    const { marketsGqlPreload } = store;

    useEffect(() => {
      store.initialize();
    }, []);

    useEffect(() => {
      if (marketsGqlPreload == null) {
        return;
      }

      window.performance.mark("MARKETS_GQL_PRELOAD_START");
      marketsGqlPreload.fetchMarkets(defaultQueryState).then((res) => {
        console.log("gql markets preload", res);
        window.performance.mark("MARKETS_GQL_PRELOAD_END");
      });
    }, [marketsGqlPreload]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
