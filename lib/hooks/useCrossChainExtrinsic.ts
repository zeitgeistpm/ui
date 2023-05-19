import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { ChainName } from "lib/constants/chains";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useState } from "react";
import { useSdkv2 } from "./useSdkv2";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useQueryClient } from "@tanstack/react-query";
import { currencyBalanceRootKey } from "./queries/useCurrencyBalances";

export const useCrossChainExtrinsic = <T>(
  extrinsicFn: (
    params: T,
  ) => SubmittableExtrinsic<"promise", ISubmittableResult>,
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

  const notifications = useNotifications();

  const send = (params?: T) => {
    setIsLoading(true);

    const extrinsic = extrinsicFn(params);
    const signer = wallet.getActiveSigner() as ExtSigner;

    signAndSend(
      extrinsic,
      signer,
      extrinsicCallback({
        api: sourceChainApi,
        notifications,
        successCallback: async (data) => {
          setIsLoading(false);
          setIsSuccess(true);

          const unsub = await destinationChainApi.query.system.events(
            (events) => {
              events.forEach((record) => {
                const { event } = record;
                const types = event.typeDef;

                // assumes that any activity for the connected address on the destination
                // chain means that there has been a successful deposit
                const destinationChainActivityDetected = event.data.some(
                  (data, index) =>
                    types[index].type === "AccountId32" &&
                    encodeAddress(
                      decodeAddress(wallet.activeAccount.address),
                    ) === encodeAddress(decodeAddress(data.toString())),
                );

                if (destinationChainActivityDetected) {
                  unsub();
                  callbacks?.onDestinationSuccess &&
                    callbacks.onDestinationSuccess();

                  queryClient.invalidateQueries([
                    id,
                    currencyBalanceRootKey,
                    wallet.activeAccount.address,
                  ]);
                }
              });
            },
          );

          callbacks?.onSourceSuccess && callbacks.onSourceSuccess(data);
        },
        failCallback: (error) => {
          setIsLoading(false);
          setIsError(true);

          callbacks?.onSourceError && callbacks.onSourceError();
          notifications.pushNotification(error, { type: "Error" });
        },
      }),
    ).catch(() => {
      setIsLoading(false);
    });
  };

  return { send, isError, isSuccess, isLoading };
};
