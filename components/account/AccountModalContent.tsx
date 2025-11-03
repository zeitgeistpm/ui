import React, { FC, useMemo } from "react";
import { LogOut } from "react-feather";
import AccountSelect, { AccountOption } from "./AccountSelect";
import { useWallet } from "lib/state/wallet";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { ZTG } from "@zeitgeistpm/sdk";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { formatNumberLocalized } from "lib/util";

const AccountModalContent: FC = () => {
  const { activeAccount, disconnectWallet, accounts, selectAccount } =
    useWallet();
  const { data: activeBalance } = useZtgBalance(activeAccount?.address);
  const { data: constants } = useChainConstants();

  const options = useMemo<AccountOption[]>(() => {
    return accounts.map((account, id) => {
      return {
        label: account.name ?? `Account #${id}`,
        value: account.address,
      };
    });
  }, [accounts]);

  const onAccountChange = (value: AccountOption) => {
    value && selectAccount(value.value);
  };

  const value = useMemo(() => {
    if (!activeAccount) return null;
    const def = options.find((o) => o.value === activeAccount?.address);
    return def || null;
  }, [activeAccount, options]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative z-10">
        <AccountSelect
          options={options}
          value={value}
          onChange={onAccountChange}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* Balance Display - More Compact */}
        <div className="flex flex-1 items-center gap-2.5 rounded-lg border-2 border-white/10 bg-white/10 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
            <img
              src="/currencies/ztg.svg"
              alt="Account balance"
              className="h-4 w-4"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="text-xs font-semibold text-white/90">
              {activeBalance && constants?.tokenSymbol
                ? `${formatNumberLocalized(Number(activeBalance.div(ZTG)))} ${constants.tokenSymbol}`
                : "---"}
            </div>
          </div>
        </div>

        {/* Disconnect Button - Matching Height */}
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-ztg-red-500/40 bg-ztg-red-900/30 px-4 py-2 backdrop-blur-sm transition-all hover:border-ztg-red-500/60 hover:bg-ztg-red-900/50"
          onClick={() => {
            disconnectWallet();
          }}
        >
          <LogOut size={16} className="text-ztg-red-400" />
          <span className="hidden text-sm font-medium text-ztg-red-300 md:block">
            Disconnect
          </span>
        </button>
      </div>
    </div>
  );
};

export default AccountModalContent;
