import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import FormTransactionButton from "components/ui/FormTransactionButton";
import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import {
  participantsRootKey,
  useParticipants,
} from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ManageDelegationsForm from "./ManageDelegationsForm";

const ManageDelegationButton = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const connectedParticipant = useConnectedCourtParticipant();

  return (
    <>
      <div className="relative">
        <button
          className={`rounded-md bg-[#670031] px-4 py-2 text-white transition-all  ${
            connectedParticipant?.type === "Juror" && "ring-2 ring-orange-500"
          } ${className}`}
          onClick={() => setIsOpen(true)}
        >
          {connectedParticipant?.type === "Delegator"
            ? "Manage Delegated Stake"
            : connectedParticipant?.type === "Juror"
              ? "Switch to Delegating"
              : "Become a Delegator"}
        </button>
        {connectedParticipant?.type === "Juror" && (
          <div className="absolute right-0 top-0 translate-x-[50%] translate-y-[-50%] rounded-full bg-orange-500 p-[0.5]">
            <InfoPopover
              overlay={false}
              className="text-white"
              position="top-end"
              popoverCss="-ml-12"
            >
              You are currently a juror. If you delegate to other jurors your
              stake will be removed from your personal stake and delegated
              evenly across your selected jurors. You will not be a juror after
              this action.
            </InfoPopover>
          </div>
        )}
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
          <h3 className="mb-8">Delegate</h3>

          <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
            <ManageDelegationsForm
              onSuccessfulSubmit={() => setIsOpen(false)}
            />
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default ManageDelegationButton;
