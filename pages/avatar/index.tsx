import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import * as React from "react";

const Avatar = () => {
  const router = useRouter();
  const wallet = useWallet();

  if (wallet.activeAccount) {
    router.replace(`/avatar/${wallet.activeAccount.address}`);
    return <></>;
  }

  return <NotFoundPage />;
};

export default Avatar;
