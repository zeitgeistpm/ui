import { Dialog } from "@headlessui/react";
import { u8aToHex } from "@polkadot/util";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { shortenAddress } from "lib/util";
import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaChevronDown } from "react-icons/fa";

export type CourtVoteFormProps = {
  caseId: number;
  market: FullMarketFragment;
};

export const CourtVoteForm: React.FC<CourtVoteFormProps> = ({
  caseId,
  market,
}) => {
  const [sdk] = useSdkv2();

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedOutcome, setSelectedOutcome] = useState(outcomeAssets[0]);

  const { phrase, salt, commitmentHash } = useCourtCommitmentHash({
    marketId: market.marketId,
    caseId: caseId,
    selectedOutcome,
  });

  const [showDetails, setShowDetails] = useState(false);

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(() => {
    if (isRpcSdk(sdk) && commitmentHash) {
      return sdk.api.tx.court.vote(caseId, commitmentHash);
    }
    return undefined;
  });

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <div className="flex center bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Vote</h3>
      </div>
      <div className="py-6 px-2 text-center">
        <div className="mb-8 mt-6">
          <MarketContextActionOutcomeSelector
            market={market}
            selected={selectedOutcome}
            options={outcomeAssets}
            onChange={(assetId) => {
              setSelectedOutcome(assetId as CategoricalAssetId);
            }}
          />
        </div>

        <div className="rounded-lg p-5 mb-4 bg-provincial-pink text-sm w-full font-normal">
          <div className="mb-4 text-sm text-gray-700">
            Your vote is secret and will be revealed at the end of the voting.
            To be able to reveal a phrase has been generated for you and is
            needed when revealing. This is stored for you locally on this
            client. <b>But please save it somewhere safe.</b>
          </div>

          <div className="w-full bg-transparent text-center font-semibold rounded-md border-1 mb-2 py-4 px-4 border-black border-opacity-30 resize-none">
            {phrase}
          </div>
          <div
            className="center text-gray-500 text-xs gap-2 cursor-default"
            onClick={() => setShowDetails(true)}
          >
            Show Details <AiOutlineEye size={12} />
          </div>
          <Modal open={showDetails} onClose={() => setShowDetails(false)}>
            <Dialog.Panel className="w-full max-w-[562px] p-6 rounded-[10px] bg-white">
              <h3 className="mb-2">Commitment Hash</h3>
              <p className="text-sm mb-4">
                The commitment hash is calculated using a combination of your
                account, the outcome you are voting for and a salt generated
                from the secret phrase.
              </p>
            </Dialog.Panel>
          </Modal>
          {/* <div className="text-xxs flex center gap-2">
            <div className="text-gray-600">
              {revealSalt ? u8aToHex(salt) : shortenAddress(u8aToHex(salt))}
            </div>
            <div
              className="cursor-pointer"
              onClick={() => setRevealSalt(!revealSalt)}
            >
              {revealSalt ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
            </div>
          </div> */}
        </div>

        {/* <div className="text-xxs">{u8aToHex(commitmentHash)}</div> */}

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting}
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isLoading || isBroadcasting}
        >
          <div>
            <div className="center font-normal h-[20px]">Place A Vote</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
