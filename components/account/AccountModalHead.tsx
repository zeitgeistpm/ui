import { useAccountModals } from "lib/state/account";

const AccountModalHead = () => {
  const accountModals = useAccountModals();

  const switchExtension = () => {
    // openWalletSelect now handles closing account select atomically
    accountModals.openWalletSelect();
  };

  return (
    <div className="flex flex-row items-center justify-between">
      <h3 className="text-lg font-bold text-white/90">Account</h3>
      <button
        className="cursor-pointer rounded-md border-2 border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/20"
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
