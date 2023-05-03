import { useAccountModals } from "lib/state/account";
import { useModalStore } from "lib/stores/ModalStore";
import { observer } from "mobx-react";
import React from "react";

const AccountModalHead = observer(() => {
  const accountModals = useAccountModals();

  const switchExtension = () => {
    accountModals.openWalletSelect();
  };

  return (
    <div className="flex flex-row justify-between">
      <div className="font-bold text-ztg-16-150 text-black">Account</div>
      <div
        className="mr-ztg-7 cursor-pointer underline"
        onClick={() => {
          switchExtension();
        }}
      >
        Switch wallet extension
      </div>
    </div>
  );
});

export default AccountModalHead;
