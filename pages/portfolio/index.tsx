import EmptyPortfolio from "components/portfolio/EmptyPortfolio";
import { useWallet } from "lib/state/wallet";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const PortfolioIndex: NextPage = () => {
  const router = useRouter();
  const wallet = useWallet();
  const [noAddress, setNoAddress] = useState<boolean>();

  useEffect(() => {
    if (wallet.activeAccount?.address) {
      router.push(
        `portfolio/${wallet.activeAccount.address ?? ""}`,
        undefined,
        {
          shallow: true,
        },
      );
    } else {
      setNoAddress(true);
    }
  }, [wallet.activeAccount]);

  return (
    <>
      {noAddress === true ? (
        <EmptyPortfolio
          headerText="No wallet connected"
          bodyText="Connect your wallet to view your Portfolio"
        />
      ) : (
        <></>
      )}
    </>
  );
};

export default PortfolioIndex;
