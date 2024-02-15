import { AddressOrPair, SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult, IEventRecord } from "@polkadot/types/types";
import { KeyringPairOrExtSigner, isExtSigner } from "@zeitgeistpm/rpc";
import { useWallet } from "lib/state/wallet";

import type { ApiPromise } from "@polkadot/api";

import { UseNotifications } from "lib/state/notifications";
import { unsubOrWarns } from "./unsub-or-warns";
import { isNTT } from "lib/constants";

type GenericCallback = (...args: any[]) => void;

const processEvents = (
  api: ApiPromise,
  events: IEventRecord<any>[],
  {
    failCallback,
    successCallback,
  }: { failCallback?: GenericCallback; successCallback?: GenericCallback },
  successMethod: string = "ExtrinsicSuccess",
  unsub?: () => void,
) => {
  for (const event of events) {
    const { data, method, section } = event.event;
    if (api.events.system.ExtrinsicFailed.is(event.event)) {
      const [dispatchError] = event.event.data;

      let errorInfo: string;

      if (dispatchError.isModule) {
        const decoded = api.registry.findMetaError(dispatchError.asModule);
        const documentation = decoded.docs.length
          ? `${decoded.section}.${decoded.name} :: ${decoded.docs.join(" ")}`
          : null;

        if (documentation) {
          errorInfo = documentation;
        } else {
          errorInfo = `ExtrinsicFailed :: ${section}.${method} :: ${decoded.section}.${decoded.name}`;
        }
      } else {
        errorInfo = dispatchError.toString();
      }

      failCallback && failCallback(errorInfo);
    } else if (successCallback && method === successMethod) {
      const res = data.toHuman();
      successCallback(res);
    }
    unsub && unsub();
  }
};

export const extrinsicCallback = ({
  api,
  successCallback,
  broadcastCallback,
  failCallback,
  finalizedCallback,
  retractedCallback,
  notifications: notificationStore,
  successMethod = "ExtrinsicSuccess",
}: {
  api: ApiPromise;
  successCallback?: (data: ISubmittableResult) => void;
  broadcastCallback?: GenericCallback;
  failCallback?: GenericCallback;
  finalizedCallback?: GenericCallback;
  retractedCallback?: GenericCallback;
  successMethod?: string;
  notifications?: UseNotifications;
}): ((res: ISubmittableResult, unsub?: () => void) => void) => {
  return (result, unsub) => {
    const { status, events } = result;

    if (status.isInBlock && successCallback) {
      processEvents(
        api,
        events,
        { failCallback, successCallback: () => successCallback(result) },
        successMethod,
        unsub,
      );
    } else if (status.isFinalized) {
      processEvents(
        api,
        events,
        { failCallback, successCallback: finalizedCallback },
        successMethod,
        unsub,
      );
    } else if (status.isRetracted) {
      retractedCallback
        ? retractedCallback()
        : notificationStore?.pushNotification(
            "This transaction was temporarily retracted. It will take a little longer to complete",
            { type: "Info" },
          );
    } else if (status.isBroadcast) {
      broadcastCallback
        ? broadcastCallback()
        : notificationStore?.pushNotification("Broadcasting transaction...", {
            autoRemove: true,
          });
    }
  };
};

export const signAndSend = async (
  tx: SubmittableExtrinsic<"promise">,
  signer: KeyringPairOrExtSigner,
  cb?: GenericCallback,
  foreignAssetNumber?: number,
) => {
  const _callback = (
    result: ISubmittableResult,
    _resolve: (value: boolean | PromiseLike<boolean>) => void,
    _reject: (value: boolean | PromiseLike<boolean>) => void,
    _unsub: any,
  ) => {
    const { events, status } = result;
    if (status.isInBlock) {
      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);

        if (method == "ExtrinsicSuccess") {
          unsubOrWarns(_unsub);
          _reject(true);
        }
        if (method == "ExtrinsicFailed") {
          unsubOrWarns(_unsub);
          _reject(false);
        }
      });
    }
  };

  return new Promise(async (resolve, reject) => {
    try {
      if (isExtSigner(signer)) {
        const unsub = await tx.signAndSend(
          signer.address,
          {
            signer: signer.signer,
            ...(foreignAssetNumber != null
              ? { assetId: foreignAssetNumber }
              : {}),
          },
          (result) => {
            cb ? cb(result, unsub) : _callback(result, resolve, reject, unsub);
          },
        );
      } else if (isNTT) {
        const unsub = await tx.signAndSend(
          signer,
          {
            ...(foreignAssetNumber != null
              ? { assetId: foreignAssetNumber }
              : {}),
          },
          (result) => {
            cb ? cb(result, unsub) : _callback(result, resolve, reject, unsub);
          },
        );
      } else {
        const unsub = await tx.signAndSend(signer, (result) => {
          cb ? cb(result, unsub) : _callback(result, resolve, reject, unsub);
        });
      }
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
};
