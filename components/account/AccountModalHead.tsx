import { isWSX } from "lib/constants";
import { useAccountModals } from "lib/state/account";

const AccountModalHead = () => {
  const accountModals = useAccountModals();

  const switchExtension = () => {
    accountModals.openWalletSelect();
  };

  return (
    <div className="flex flex-row justify-between">
      <div className="text-ztg-16-150 font-bold text-black">Account</div>
      {!isWSX && (
        <div
          className="mr-ztg-7 cursor-pointer underline"
          onClick={() => {
            switchExtension();
          }}
        >
          Switch wallet extension
        </div>
      )}
    </div>
  );
};

export default AccountModalHead;
