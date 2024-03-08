import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { IOForeignAssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useMemo, useState } from "react";
import { useSdkv2 } from "./useSdkv2";
import { useExtrinsicFee } from "./queries/useExtrinsicFee";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
import UniversalProvider from "@walletconnect/universal-provider";

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

  //Show transaction confirmation modal for web3auth
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
    if (!signer) return;
    console.log(extrinsic);

    if (!wallet.activeAccount?.address) {
      return;
    }
    const lastHeader = await sdk.api.rpc.chain.getHeader();
    console.log(lastHeader);

    const blockNumber = sdk.api.registry.createType(
      "BlockNumber",
      lastHeader.number.toNumber(),
    );
    console.log(blockNumber);

    const tx = extrinsic.method;

    const method = sdk.api.createType("Call", tx);
    console.log(method);

    const era = sdk.api.registry.createType("ExtrinsicEra", {
      current: lastHeader.number.toNumber(),
      period: 64,
    });
    console.log(era);

    const accountNonce =
      (await sdk.api.query.system.account(wallet.activeAccount?.address)) || 0;
    const nonce = sdk.api.registry.createType(
      "Compact<Index>",
      accountNonce.nonce,
    );
    console.log(accountNonce, nonce);

    const specVersion = sdk.api.runtimeVersion.specVersion;
    const transactionVersion = sdk.api.runtimeVersion.transactionVersion;

    console.log(specVersion, transactionVersion);

    const unsignedTransaction = {
      specVersion: specVersion.toHex(),
      transactionVersion: transactionVersion.toHex(),
      address: wallet.activeAccount?.address,
      blockHash: lastHeader.hash.toHex(),
      blockNumber: blockNumber.toHex(),
      era: era.toHex(),
      genesisHash: sdk.api.genesisHash.toHex(),
      method: method.toHex(),
      nonce: nonce.toHex(),
      signedExtensions: [
        "CheckNonZeroSender",
        "CheckSpecVersion",
        "CheckTxVersion",
        "CheckGenesis",
        "CheckMortality",
        "CheckNonce",
        "CheckWeight",
        "ChargeTransactionPayment",
      ],
      tip: sdk.api.registry.createType("Compact<Balance>", 0).toHex(),
      version: extrinsic.version,
    };
    console.log(unsignedTransaction);
    const wcProvider = await UniversalProvider.init({
      projectId: "bc3373ccb16b53e7d5eb57672db4b4f8",
      relayUrl: "wss://relay.walletconnect.com",
    });

    const result = await wcProvider.client.request({
      chainId: "polkadot:1bf2a2ecb4a868de66ea8610f2ce7c8c",
      topic: "98acd26989f41be9ea148477d6af3417f0e4b3c7480bfcf4e996c2a427dad805",
      request: {
        method: "polkadot_signTransaction",
        params: {
          address: "dE38s12vhpZtsgJKjAXBxCGKqDEEtfypufj1EebndBQnEm2gt",
          transactionPayload: unsignedTransaction,
        },
      },
    });
    console.log(result);

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
