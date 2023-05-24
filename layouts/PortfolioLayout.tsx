import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import React, { PropsWithChildren, useEffect, useState } from "react";

const PortfolioLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const wallet = useWallet();
  const [noAddress, setNoAddress] = useState<boolean>();

  useEffect(() => {
    if (wallet.activeAccount?.address) {
      router.replace(
        `/portfolio/${wallet.activeAccount.address ?? ""}`,
        undefined,
        {
          shallow: true,
        },
      );
      setNoAddress(false);
    } else {
      router.replace(`/portfolio`, undefined, {
        shallow: true,
      });
      setNoAddress(true);
    }
  }, [wallet.activeAccount, router.asPath]);

  return (
    <>
      {noAddress === true ? (
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
