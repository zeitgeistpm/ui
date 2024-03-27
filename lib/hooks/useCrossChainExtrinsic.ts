import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ChainName } from "lib/constants/chains";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useMemo, useState } from "react";
import { useSdkv2 } from "./useSdkv2";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useQueryClient } from "@tanstack/react-query";
import { currencyBalanceRootKey } from "./queries/useCurrencyBalances";
import { IOForeignAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useExtrinsicFee } from "./queries/useExtrinsicFee";

export const useCrossChainExtrinsic = <T>(
  extrinsicFn: (
    params?: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult> | undefined,
  sourceChain: ChainName,
  destinationChain: ChainName,
  callbacks?: {
    onSourceSuccess?: (data: ISubmittableResult) => void;
    onDestinationSuccess?: () => void;
    onSourceError?: () => void;
  },
) => {
  const [sdk, id] = useSdkv2();
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { api: sourceChainApi } = useChain(sourceChain);
  const { api: destinationChainApi } = useChain(destinationChain);

  const extrinsic = useMemo(() => {
    const ext = extrinsicFn();
    return ext;
  }, [extrinsicFn]);

  const { data: fee } = useExtrinsicFee(extrinsic);

  const notifications = useNotifications();

  const send = (params?: T) => {
    if (!isRpcSdk(sdk)) {
      throw new Error("SDK is not RPC");
    }
    setIsLoading(true);

    let extrinsic = extrinsicFn(params);

    const proxy = wallet?.getProxyFor(wallet.activeAccount?.address);
    let signer = wallet.getSigner();

    if (extrinsic && proxy?.enabled && proxy?.address) {
      console.info("Proxying cross chain transaction");
      extrinsic = sdk.api.tx.proxy.proxy(proxy?.address, null, extrinsic);
      notifications.pushNotification(
        "Proxies are not supported for cross chain transactions",
        {
          type: "Info",
        },
      );
    }

    if (!signer || !extrinsic || !sourceChainApi || !destinationChainApi)
      return;

    const extrinsicCallbackParams = {
      api: sourceChainApi,
      notifications,
      successCallback: async (data) => {
        callbacks?.onSourceSuccess && callbacks.onSourceSuccess(data);

        const unsub = await destinationChainApi.query.system.events(
          (events) => {
            for (const record of events) {
              const { event } = record;
              const { method } = event;
              const types = event.typeDef;

              // assumes that any activity for the connected address on the destination
              // chain means that there has been a successful deposit
              const destinationChainActivityDetected = event.data.some(
                (data, index) =>
                  types[index].type === "AccountId32" &&
                  ["deposit", "deposited"].includes(method.toLowerCase()) &&
                  encodeAddress(
                    decodeAddress(wallet.activeAccount?.address),
                  ) === encodeAddress(decodeAddress(data.toString())),
              );

              if (destinationChainActivityDetected) {
                unsub();
                setIsLoading(false);
                setIsSuccess(true);
                callbacks?.onDestinationSuccess &&
                  callbacks.onDestinationSuccess();

                queryClient.invalidateQueries([
                  id,
                  currencyBalanceRootKey,
                  wallet.activeAccount?.address,
                ]);
                break;
              }
            }
          },
        );
      },
      failCallback: (error) => {
        setIsLoading(false);
        setIsError(true);

        callbacks?.onSourceError && callbacks.onSourceError();
        notifications.pushNotification(error, { type: "Error" });
      },
    };

    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback(extrinsicCallbackParams),
      IOForeignAssetId.is(fee?.assetId) ? fee?.assetId.ForeignAsset : undefined,
    ).catch((error) => {
      notifications.pushNotification(error?.toString() ?? "Unknown Error", {
        type: "Error",
      });
      setIsLoading(false);
    });
  };

  return { send, isError, isSuccess, isLoading };
};
