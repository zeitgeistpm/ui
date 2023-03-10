import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Store from "lib/stores/Store";
import { useSdkv2 } from "lib/hooks/useSdkv2";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<PropsWithChildren<{ store: Store }>> = observer(
  ({ children, store }) => {
    useEffect(() => {
      store.initialize();
    }, []);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
