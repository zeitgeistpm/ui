import { useAccountModals } from "lib/state/account";

const AccountModalHead = () => {
  const accountModals = useAccountModals();

  const switchExtension = () => {
    accountModals.openWalletSelect();
  };

  return (
    <div className="flex flex-row justify-between">
      <div className="text-lg font-bold">Account</div>
      <div
        className="cursor-pointer rounded-lg border-2 border-gray-300 px-1 hover:border-gray-400"
        onClick={() => {
          switchExtension();
        }}
      >
        Switch wallet extension
      </div>
    </div>
  );
};

export default AccountModalHead;
