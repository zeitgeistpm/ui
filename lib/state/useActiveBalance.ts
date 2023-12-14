import { useState, useEffect } from "react";
import { encodeAddress } from "@polkadot/util-crypto";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { isRpcSdk, AssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { ZTG } from "@zeitgeistpm/sdk";
import { wsxIdObject } from "lib/constants";

const useActiveBalance = (
  userAddress: string | undefined,
  foreignAssetId?: AssetId,
) => {
  const assetId = foreignAssetId || wsxIdObject;
  const [balance, setBalance] = useState<Decimal | undefined>(undefined);
  const [sdk, id] = useSdkv2();
  const confirm = useConfirmation();

  useEffect(() => {
    let unsubscribe;

    const subscribeToBalance = async () => {
      if (
        isRpcSdk(sdk) &&
        userAddress &&
        sdk.api.query.tokens &&
        sdk.api.query.tokens.accounts &&
        IOForeignAssetId.is(assetId)
      ) {
        console.log(encodeAddress(userAddress, 73));
        try {
          unsubscribe = await sdk.api.query.tokens.accounts(
            userAddress,
            assetId,
            (balance) => {
              const newBalance = new Decimal(balance.free.toString());
              setBalance((prevBalance) => {
                return prevBalance?.equals(newBalance)
                  ? prevBalance
                  : newBalance;
              });
            },
          );
        } catch (error) {
          console.error("Error setting up balance subscription:", error);
        }
      }
    };

    subscribeToBalance();

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [sdk, userAddress]);

  useEffect(() => {
    // Check if previous balance was 0 and current balance is 100
    // console.log(
    //   balance?.div(ZTG).abs().toNumber(),
    //   prevBalance?.div(ZTG).abs().toNumber(),
    // );
    // if (
    //   prevBalance?.equals(new Decimal(0)) &&
    //   balance?.equals(new Decimal(100))
    // ) {
    //   // Place your logic here
    //   confirm.prompt({
    //     title: "Welcome to The Washington Stock Exchange!",
    //     description: `In just a few moments your account will be funded with 100 WSX tokens.
    //       These tokens can be used to trade on prediction markets on The WSX platform.`,
    //   });
    // }
  }, [balance]);
  console.log(balance?.div(ZTG).abs().toNumber());
  return balance;
};

export default useActiveBalance;
