import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { IOForeignAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend, sendUnsigned } from "lib/util/tx";
import { useMemo, useState } from "react";
import { useSdkv2 } from "./useSdkv2";
import { useExtrinsicFee } from "./queries/useExtrinsicFee";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";

export const useExtrinsic = <T>(
  extrinsicFn: (
    params?: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult> | undefined,
  callbacks?: {
    onSuccess?: (data: ISubmittableResult) => void;
    onBroadcast?: () => void;
    onError?: () => void;
  },
) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const confirm = useConfirmation();

  const confirmEnabled = wallet?.walletId === "web3auth";
  const walletId = wallet?.walletId;

  const notifications = useNotifications();

  const extrinsic = useMemo(() => {
    const ext = extrinsicFn();
    return ext;
  }, [extrinsicFn]);

  const { data: fee } = useExtrinsicFee(extrinsic);
  const resetState = () => {
    setIsError(false);
    setIsSuccess(false);
    setIsLoading(false);
    setIsBroadcasting(false);
  };

  const send = async (params?: T) => {
    if (!isRpcSdk(sdk)) {
      throw new Error("SDK is not RPC");
    }

    let extrinsic = extrinsicFn(params);
    if (!extrinsic) return;

    const proxy = wallet?.getProxyFor(wallet.activeAccount?.address);

    if (proxy?.enabled && proxy?.address) {
      console.info("Proxying transaction");
      extrinsic = sdk.api.tx.proxy.proxy(proxy?.address, null, extrinsic);
    }

    setIsLoading(true);

    if (confirmEnabled) {
      const confirmed = await confirm.prompt({
        title: "Confirm Transaction",
        description:
          "This will make a onchain transaction. Please confirm that you want to proceed.",
      });

      if (!confirmed) {
        setIsLoading(false);
        return;
      }
    }

    if (!wallet.activeAccount?.address) return;

    const extrinsicCallbackParams = {
      api: sdk.api,
      notifications,
      broadcastCallback: () => {
        setIsBroadcasting(true);
        callbacks?.onBroadcast
          ? callbacks.onBroadcast()
          : notifications?.pushNotification("Broadcasting transaction...", {
              autoRemove: true,
            });
      },
      successCallback: (data) => {
        setIsLoading(false);
        setIsSuccess(true);
        setIsBroadcasting(false);

        callbacks?.onSuccess && callbacks.onSuccess(data);
      },
      failCallback: (error) => {
        setIsLoading(false);
        setIsError(true);
        setIsBroadcasting(false);

        callbacks?.onError && callbacks.onError();
        notifications.pushNotification(error, { type: "Error" });
      },
    };

    if (walletId === "walletconnect") {
      sendUnsigned(
        sdk.api,
        extrinsic,
        wallet.activeAccount?.address,
        extrinsicCallback(extrinsicCallbackParams),
      ).catch((error) => {
        notifications.pushNotification(error?.toString() ?? "Unknown Error", {
          type: "Error",
        });
        setIsBroadcasting(false);
        setIsLoading(false);
      });
    } else {
      const signer = wallet.getSigner();
      if (!signer) return;

      signAndSend(
        extrinsic,
        signer,
        extrinsicCallback(extrinsicCallbackParams),
        IOForeignAssetId.is(fee?.assetId)
          ? fee?.assetId.ForeignAsset
          : undefined,
      ).catch((error) => {
        notifications.pushNotification(error?.toString() ?? "Unknown Error", {
          type: "Error",
        });
        setIsBroadcasting(false);
        setIsLoading(false);
      });
    }
  };

  return {
    send,
    isReady: !!extrinsic,
    isError,
    isSuccess,
    isLoading,
    isBroadcasting,
    fee,
    resetState,
  };
};
