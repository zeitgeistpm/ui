import React, { FC, useEffect } from "react";
import { observer } from "mobx-react";

import Store from "lib/stores/Store";

export const StoreContext = React.createContext<Store | null>(null);

export const StoreProvider: FC<{store: Store}> = observer(({ children, store }) => {
  useEffect(() => {
    store.initialize();
  }, []);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
});

