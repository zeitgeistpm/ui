import { useStore } from "lib/stores/Store";
import { useRouter } from "next/router";
import NotFoundPage from "pages/404";
import * as React from "react";

const Avatar = () => {
  const router = useRouter();
  const store = useStore();

  if (store.wallets.activeAccount) {
    router.replace(`/avatar/${store.wallets.activeAccount.address}`);
    return <></>;
  }

  return <NotFoundPage />;
};

export default Avatar;
