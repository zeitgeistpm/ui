import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { useWallet } from "lib/state/wallet";
import { getQueryParams } from "lib/util/get-query-params";
import Skeleton from "components/ui/Skeleton";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect, useState, useMemo } from "react";

const PortfolioLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const wallet = useWallet();
  const [hasAddress, setHasAddress] = useState<boolean>();
  const [isAccountAddress, setIsAccountAddress] = useState<boolean>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAddressRoute = router.query.address !== undefined;
  const addressFromRoute = isAddressRoute
    ? Array.isArray(router.query.address)
      ? router.query.address[0]
      : router.query.address
    : undefined;

  const queryParams = useMemo(
    () => getQueryParams(router.asPath),
    [router.asPath],
  );

  useEffect(() => {
    if (!router.isReady) return;

    if (addressFromRoute) {
      setHasAddress(true);
      setIsAccountAddress(addressFromRoute === wallet.activeAccount?.address);

      const targetPath = `/portfolio/${addressFromRoute}`;
      const currentPath = router.pathname;

      if (currentPath !== targetPath) {
        router.replace(
          { pathname: targetPath, query: queryParams },
          undefined,
          {
            shallow: true,
          },
        );
      }
      setIsLoading(false);
    } else if (wallet.activeAccount?.address && wallet.realAddress) {
      setHasAddress(true);
      setIsAccountAddress(true);

      const targetPath = `/portfolio/${wallet.realAddress}`;
      const currentPath = router.pathname;

      if (currentPath !== targetPath) {
        router.replace(
          {
            pathname: targetPath,
            query: queryParams,
          },
          undefined,
          {
            shallow: true,
          },
        );
      }
      setIsLoading(false);
    } else {
      setHasAddress(false);
      setIsLoading(false);
    }
  }, [
    addressFromRoute,
    router.isReady,
    wallet.activeAccount?.address,
    wallet.realAddress,
    queryParams,
    router.pathname,
  ]);

  if (isLoading) {
    return (
      <div className="container-fluid flex min-h-[50vh] w-full items-center justify-center">
        <div className="rounded-lg border border-ztg-primary-200/30 bg-white/10 p-8 shadow-lg backdrop-blur-md">
          <Skeleton className="w-32" variant="dots" />
        </div>
      </div>
    );
  }

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
