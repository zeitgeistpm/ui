import { from } from "rxjs";
import React, { FC, PropsWithChildren, useEffect, useState } from "react";
import { observer } from "mobx-react";
import Store from "lib/stores/Store";
export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<PropsWithChildren<{ store: Store }>> = observer(
  ({ children, store }) => {
    useEffect(() => {
      const sub = from(store.initialize()).subscribe();
      return () => sub.unsubscribe();
    }, []);

    return (
      <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
  },
);
