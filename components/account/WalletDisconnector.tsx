import { useUserLocation } from "lib/hooks/useUserLocation";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect } from "react";

export const WalletDisconnector = observer(() => {
  const store = useStore();

  const { isFetched, isUsingVPN, locationAllowed } = useUserLocation();

  useEffect(() => {
    if (isFetched && (!locationAllowed || isUsingVPN)) {
      console.info("Your location is disallowed: disconnecting wallet");
      store.wallets.disconnectWallet();
    }
  }, [isFetched, locationAllowed, isUsingVPN]);

  return <></>;
});
