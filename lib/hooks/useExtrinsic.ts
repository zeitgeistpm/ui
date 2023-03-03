import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";

export const useExtrinsic = <T>(
  extrinsicFn: (
    params: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult>,
  callbacks?: {
    onSuccess?: () => void;
    onError?: () => void;
  },
) => {
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const notificationStore = useNotificationStore();
  const store = useStore();

  const send = (params?: T) => {
    setIsLoading(true);
    const extrinsic = extrinsicFn(params);
    const signer = store.wallets.getActiveSigner() as ExtSigner;
    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
        notificationStore,
        successCallback: () => {
          setIsLoading(false);
          setIsSuccess(true);

          callbacks?.onSuccess && callbacks.onSuccess();
        },
        failCallback: ({ index, error }) => {
          setIsLoading(false);
          setIsError(true);

          callbacks?.onError && callbacks.onError();
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            { type: "Error" },
          );
        },
      }),
    ).catch(() => {
      setIsLoading(false);
    });
  };

  return { send, isError, isSuccess, isLoading };
};
