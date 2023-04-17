import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult, IEventRecord } from "@polkadot/types/types";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { isExtSigner, unsubOrWarns } from "@zeitgeistpm/sdk/dist/util";

import { UseNotifications } from "lib/state/notifications";

type GenericCallback = (...args: any[]) => void;

const processEvents = (
  events: IEventRecord<any>[],
  {
    failCallback,
    successCallback,
  }: { failCallback?: GenericCallback; successCallback?: GenericCallback },
  successMethod: string = "ExtrinsicSuccess",
  unsub?: () => void,
) => {
  for (const event of events) {
    const { data, method } = event.event;
    if (method === "ExtrinsicFailed" && failCallback) {
      const { index, error } = data.toHuman()["dispatchError"].Module;
      failCallback({ index, error });
    }
    if (method === "BatchInterrupted" && failCallback) {
      const { index, error } = data.toHuman().error.Module;
      failCallback({ index, error }, +data.toHuman().index);
    } else if (successCallback && method === successMethod) {
      const res = data.toHuman();
      successCallback(res);
    }
    unsub && unsub();
  }
};

export const extrinsicCallback = ({
  successCallback,
  broadcastCallback,
  failCallback,
  finalizedCallback,
  retractedCallback,
  notifications: notificationStore,
  successMethod = "ExtrinsicSuccess",
}: {
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
        events,
        { failCallback, successCallback: () => successCallback(result) },
        successMethod,
        unsub,
      );
    } else if (status.isFinalized) {
      processEvents(
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
          { signer: signer.signer },
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
      reject(error);
    }
  });
};
