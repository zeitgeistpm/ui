import { observer } from "mobx-react";
import { useEffect, useState } from "react";

import { ModalStoreContext } from "components/context/ModalStoreContext";
import { StoreProvider } from "components/context/StoreContext";
import ModalStore from "lib/stores/ModalStore";
import Store from "lib/stores/Store";
import ModalContainer from "components/modal/ModalContainer";

const StoreComponent: React.FC = observer(({ children }) => {
  const [modalStore] = useState(() => new ModalStore());
  const [store] = useState(() => new Store());

  useEffect(() => {
    const clientWidth = window.innerWidth;
    if (clientWidth < 1300) {
      store.toggleDrawer("right");
    } else {
      store.navigationStore.toggleGroupOpen("markets");
    }
    if (clientWidth < 900) {
      store.toggleDrawer("left");
    }
  }, []);

  return (
    <StoreProvider store={store}>
      <ModalStoreContext.Provider value={modalStore}>
        {modalStore.modal && (
          <ModalContainer>{modalStore.modal}</ModalContainer>
        )}
      </ModalStoreContext.Provider>
      {children}
    </StoreProvider>
  );
});

export default StoreComponent;
