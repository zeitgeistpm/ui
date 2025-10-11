import { useAccountModals } from "lib/state/account";

const AccountModalHead = () => {
  const accountModals = useAccountModals();

  const switchExtension = () => {
    accountModals.openWalletSelect();
  };

  return (
    <div className="flex flex-row items-center justify-between">
      <h3 className="text-lg font-bold text-sky-900">Account</h3>
      <button
        className="cursor-pointer rounded-md border border-sky-200/30 bg-sky-50/50 px-3 py-1.5 text-xs font-medium text-sky-900 backdrop-blur-sm transition-all hover:border-sky-300/50 hover:bg-sky-100/60"
        onClick={() => {
          switchExtension();
        }}
      >
        Switch wallet extension
      </button>
    </div>
  );
};

export default AccountModalHead;
