import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";
import { useErrorTable } from "./queries/useErrorTable";

export const useExtrinsic = <T>(
  extrinsicFn: (
    params: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult>,
  callbacks?: {
    onSuccess?: (data: ISubmittableResult) => void;
    onError?: () => void;
  },
) => {
  const wallet = useWallet();
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const notifications = useNotifications();

  const { data: errorTable } = useErrorTable();

  const send = (params?: T) => {
    setIsLoading(true);
    const extrinsic = extrinsicFn(params);

    const signer = wallet.getActiveSigner() as ExtSigner;
    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
        notifications,
        successCallback: (data) => {
          setIsLoading(false);
          setIsSuccess(true);

          callbacks?.onSuccess && callbacks.onSuccess(data);
        },
        failCallback: ({ index, error }) => {
          setIsLoading(false);
          setIsError(true);

          callbacks?.onError && callbacks.onError();
          notifications.pushNotification(
            errorTable?.getTransactionError(index, error),
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
