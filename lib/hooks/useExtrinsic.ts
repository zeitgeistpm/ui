import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useNotifications } from "lib/state/notifications";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";

export const useExtrinsic = <T>(
  extrinsicFn: (
    params: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult>,
  callbacks?: {
    onSuccess?: (...args: any[]) => void;
    onError?: () => void;
  },
) => {
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const notifications = useNotifications();
  const store = useStore();

  const send = (params?: T) => {
    setIsLoading(true);
    const extrinsic = extrinsicFn(params);
    const signer = store.wallets.getActiveSigner() as ExtSigner;
    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
        notifications,
        successCallback: () => {
          setIsLoading(false);
          setIsSuccess(true);

          callbacks?.onSuccess && callbacks.onSuccess();
        },
        failCallback: ({ index, error }) => {
          setIsLoading(false);
          setIsError(true);

          callbacks?.onError && callbacks.onError();
          notifications.pushNotification(
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
