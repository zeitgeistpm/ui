import { useUserLocation } from "lib/hooks/useUserLocation";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect } from "react";

export const WalletDisconnector = observer(() => {
  const store = useStore();

  //TODO: store user location state in valtio and react to it in wallet valtio state

  const { isFetched, isUsingVPN, locationAllowed } = useUserLocation();

  useEffect(() => {
    if (isFetched && (!locationAllowed || isUsingVPN)) {
      console.info("Your location is disallowed: disconnecting wallet");
      //store.wallet.disconnectWallet();
    }
  }, [isFetched, locationAllowed, isUsingVPN]);

  return <></>;
});
