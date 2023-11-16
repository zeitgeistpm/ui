import React, { FC, useMemo } from "react";
import { LogOut } from "react-feather";
import AccountSelect, { AccountOption } from "./AccountSelect";
import { useWallet } from "lib/state/wallet";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { ZTG } from "@zeitgeistpm/sdk";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

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
    <div className="flex flex-col">
      <AccountSelect
        options={options}
        value={value}
        onChange={onAccountChange}
      />
      <div className="mt-ztg-15 flex h-ztg-50 items-center justify-between">
        <div className="flex h-full flex-grow items-center rounded-ztg-10 bg-sky-100 dark:bg-black">
          <div className="flex items-center px-ztg-8">
            <div className="center h-ztg-28 w-ztg-28 rounded-full bg-white dark:bg-sky-1000">
              <div className="center h-ztg-22 w-ztg-22 rounded-full bg-sky-100 dark:bg-black">
                <div className="center h-ztg-16 w-ztg-16 rounded-full bg-border-dark dark:bg-sky-1000">
                  <img
                    src="/icons/acc-balance.svg"
                    alt="Account balance"
                    style={{ marginTop: "-1px" }}
                  />
                </div>
              </div>
            </div>
            <div className="ml-ztg-16 flex flex-col">
              <div className="text-ztg-10-150 font-bold uppercase text-sky-600">
                balance
              </div>
              <div className="font-mono text-ztg-14-120 font-bold text-sheen-green">
                {`${activeBalance?.div(ZTG).toFixed(4)} ${
                  constants?.tokenSymbol ?? ""
                }` ?? "---"}
              </div>
            </div>
          </div>
        </div>
        <div
          className="ml-ztg-16 flex h-full w-ztg-176 cursor-pointer items-center justify-evenly rounded-ztg-10 bg-border-light text-white dark:bg-sky-700"
          onClick={() => {
            disconnectWallet();
          }}
        >
          <div className=" text-ztg-16-150 capitalize">disconnect</div>
          <LogOut size={16} className="-ml-ztg-30 text-white" />
        </div>
      </div>
    </div>
  );
};

export default AccountModalContent;
