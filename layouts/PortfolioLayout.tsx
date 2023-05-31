import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { useWallet } from "lib/state/wallet";
import { getQueryParams } from "lib/util/get-query-params";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect, useState } from "react";

const PortfolioLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const wallet = useWallet();
  const [hasAddress, setHasAddress] = useState<boolean>();
  const [isAccountAddress, setIsAccountAddress] = useState<boolean>();

  const isAddressRoute = router.query.address !== undefined;
  const addressFromRoute = isAddressRoute
    ? Array.isArray(router.query.address)
      ? router.query.address[0]
      : router.query.address
    : undefined;

  const queryParams = getQueryParams(router.asPath);

  useEffect(() => {
    if (!router.isReady) return;

    if (addressFromRoute && !isAccountAddress) {
      setHasAddress(true);
      setIsAccountAddress(addressFromRoute === wallet.activeAccount?.address);
      router.replace(
        { pathname: `/portfolio/${addressFromRoute}`, query: queryParams },
        undefined,
        {
          shallow: true,
        },
      );
    } else if (wallet.activeAccount?.address) {
      setHasAddress(true);
      setIsAccountAddress(true);
      router.replace(
        {
          pathname: `/portfolio/${wallet.activeAccount.address}`,
          query: queryParams,
        },
        undefined,
        {
          shallow: true,
        },
      );
    } else {
      setHasAddress(false);
    }
  }, [addressFromRoute, router.isReady, wallet.activeAccount?.address]);

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
