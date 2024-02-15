import { useState, useEffect } from "react";
import { encodeAddress } from "@polkadot/util-crypto";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isRpcSdk, AssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { ZTG } from "@zeitgeistpm/sdk";
import { nttIDObject } from "lib/constants";
import { walletAtom, store } from "./wallet";
import { useAtom } from "jotai";
import { formatNumberLocalized } from "lib/util";

const useActiveBalance = (
  userAddress: string | undefined,
  foreignAssetId?: AssetId,
) => {
  const [balance, setBalance] = useState<Decimal | undefined>(undefined);
  const [walletState, setWalletState] = useAtom(walletAtom);
  const confirm = useConfirmation();

  useEffect(() => {
    if (
      balance &&
      balance?.div(ZTG).abs().toNumber() === 100 &&
      walletState.newUser
    ) {
      store.set(walletAtom, (state) => {
        return {
          ...state,
          newUser: false,
        };
      });
      confirm.prompt({
        title: "Your account is now funded!",
        description: `You have ${formatNumberLocalized(
          balance?.div(ZTG).abs().toNumber(),
        )} NTT in your account.`,
      });
    }
  }, [balance, walletState.newUser]);

  return balance;
};

export default useActiveBalance;
