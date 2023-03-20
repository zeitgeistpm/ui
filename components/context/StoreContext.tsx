import { from } from "rxjs";
import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Store from "lib/stores/Store";
import { useEndpointSettings } from "lib/state/endpointSettings";
export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<PropsWithChildren<{ store: Store }>> = observer(
  ({ children, store }) => {
    const { endpoint, getNextBestEndpoint, setEndpoint } =
      useEndpointSettings();

    useEffect(() => {
      const sub = from(store.initialize(endpoint)).subscribe();
      return () => sub.unsubscribe();
    }, [endpoint]);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
