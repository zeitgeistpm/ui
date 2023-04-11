import { useStore } from "lib/stores/Store";
import { useWallet } from "lib/stores/wallets";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import * as React from "react";

const Avatar = () => {
  const router = useRouter();
  const store = useStore();
  const wallet = useWallet();

  if (wallet.activeAccount) {
    router.replace(`/avatar/${wallet.activeAccount.address}`);
    return <></>;
  }

  return <NotFoundPage />;
};

export default Avatar;
