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
      <div className="flex items-center justify-between h-ztg-50 mt-ztg-15">
        <div className="rounded-ztg-10 h-full bg-sky-100 dark:bg-black flex items-center flex-grow">
          <div className="px-ztg-8 flex items-center">
            <div className="center rounded-full w-ztg-28 h-ztg-28 bg-white dark:bg-sky-1000">
              <div className="center rounded-full w-ztg-22 h-ztg-22 bg-sky-100 dark:bg-black">
                <div className="center rounded-full w-ztg-16 h-ztg-16 bg-border-dark dark:bg-sky-1000">
                  <img
                    src="/icons/acc-balance.svg"
                    alt="Account balance"
                    style={{ marginTop: "-1px" }}
                  />
                </div>
              </div>
            </div>
            <div className="ml-ztg-16 flex flex-col">
              <div className="uppercase text-ztg-10-150 font-bold text-sky-600">
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
          className="flex justify-evenly items-center w-ztg-176 bg-border-light dark:bg-sky-700 ml-ztg-16 rounded-ztg-10 h-full text-white cursor-pointer"
          onClick={() => {
            disconnectWallet();
          }}
        >
          <div className=" text-ztg-16-150 capitalize">disconnect</div>
          <LogOut size={16} className="text-white -ml-ztg-30" />
        </div>
      </div>
    </div>
  );
};

export default AccountModalContent;
