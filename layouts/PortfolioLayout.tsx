import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect, useState } from "react";

const PortfolioLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const wallet = useWallet();
  const [hasAddress, setHasAddress] = useState<boolean>();

  const isAddressRoute = router.query.address !== undefined;
  const addressFromRoute = isAddressRoute
    ? Array.isArray(router.query.address)
      ? router.query.address[0]
      : router.query.address
    : undefined;

  const address = wallet.activeAccount?.address ?? addressFromRoute;

  useEffect(() => {
    if (!router.isReady) return;
    if (address) {
      router.replace(`/portfolio/${address}`, undefined, { shallow: true });
      setHasAddress(true);
    } else {
      router.replace(`/portfolio`, undefined, {
        shallow: true,
      });
      setHasAddress(false);
    }
  }, [address, router.isReady]);

  return (
    <>
      {hasAddress === false ? (
        <EmptyPortfolio
          headerText="No wallet connected"
          bodyText="Connect your wallet to view your Portfolio"
        />
      ) : (
        <>{children}</>
      )}
    </>
  );
};

export default PortfolioLayout;
