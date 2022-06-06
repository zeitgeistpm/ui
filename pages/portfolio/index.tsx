import { NextPage } from "next";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useStore } from "lib/stores/Store";

const PortfolioIndex: NextPage = observer(() => {
  const router = useRouter();
  const store = useStore();
  const { wallets } = store;
  const [noAddress, setNoAddress] = useState<boolean>();

  useEffect(() => {
    if (wallets.activeAccount?.address) {
      router.push(
        `portfolio/${wallets.activeAccount.address ?? ""}`,
        undefined,
        {
          shallow: true,
        }
      );
    } else {
      setNoAddress(true);
    }
  }, [wallets.activeAccount]);

  return (
    <>
      {noAddress === true ? <div>Connect wallet to view portfolio</div> : <></>}
    </>
  );
});

export default PortfolioIndex;
