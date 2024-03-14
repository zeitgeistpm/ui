import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { IOForeignAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend, constructUnsigned } from "lib/util/tx";
import { useMemo, useState } from "react";
import { useSdkv2 } from "./useSdkv2";
import { useExtrinsicFee } from "./queries/useExtrinsicFee";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import { useAtom } from "jotai";
import { providerAtom, sessionAtom } from "lib/state/util/web3auth-config";

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
  const [provider] = useAtom(providerAtom);
  const [session] = useAtom(sessionAtom); //Show transaction confirmation modal for web3auth
  const confirmEnabled = wallet?.walletId === "web3auth";

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

    const signer = wallet.getSigner();

    //todo: renable
    // if (!signer) return;

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
    console.log(provider, session);

    console.log(wallet.activeAccount?.address);
    if (!wallet.activeAccount?.address) return;

    const signature = constructUnsigned(
      sdk.api,
      extrinsic,
      wallet.activeAccount?.address,
      provider,
      session,
    );
    console.log(signature);
    return;
    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
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
      }),
      IOForeignAssetId.is(fee?.assetId) ? fee?.assetId.ForeignAsset : undefined,
    ).catch((error) => {
      notifications.pushNotification(error?.toString() ?? "Unknown Error", {
        type: "Error",
      });
      setIsBroadcasting(false);
      setIsLoading(false);
    });
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
