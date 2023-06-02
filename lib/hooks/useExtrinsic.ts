import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";
import { useSdkv2 } from "./useSdkv2";

export const useExtrinsic = <T>(
  extrinsicFn: (
    params?: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult> | undefined,
  callbacks?: {
    onSuccess?: (data: ISubmittableResult) => void;
    onError?: () => void;
  },
) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const notifications = useNotifications();

  const send = (params?: T) => {
    if (!isRpcSdk(sdk)) {
      throw new Error("SDK is not RPC");
    }

    setIsLoading(true);

    const extrinsic = extrinsicFn(params);
    if (!extrinsic) return;
    const signer = wallet.getActiveSigner() as ExtSigner;

    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
        api: sdk.api,
        notifications,
        successCallback: (data) => {
          setIsLoading(false);
          setIsSuccess(true);

          callbacks?.onSuccess && callbacks.onSuccess(data);
        },
        failCallback: (error) => {
          setIsLoading(false);
          setIsError(true);

          callbacks?.onError && callbacks.onError();
          notifications.pushNotification(error, { type: "Error" });
        },
      }),
    ).catch(() => {
      setIsLoading(false);
    });
  };

  return { send, isError, isSuccess, isLoading };
};
