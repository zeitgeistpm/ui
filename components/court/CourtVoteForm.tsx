import { Dialog } from "@headlessui/react";
import { u8aToHex } from "@polkadot/util";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { selectedDrawsRootKey } from "lib/hooks/queries/court/useSelectedDraws";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import React, { useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { FaArrowRight } from "react-icons/fa";
import { HiOutlineDocumentDownload } from "react-icons/hi";

export type CourtVoteFormProps = {
  caseId: number;
  market: FullMarketFragment;
};

export const CourtVoteForm: React.FC<CourtVoteFormProps> = ({
  caseId,
  market,
}) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const { vote, setVote, committed, commitVote } = useCourtVote({
    caseId,
    marketId: market.marketId,
    defaultValue: outcomeAssets[0],
  });

  const { salt, phraseStorage, downloadBackup, isBackedUp } = useCourtSalt({
    marketId: market.marketId,
    caseId: caseId,
  });

  const { commitmentHash } = useCourtCommitmentHash({
    salt,
    selectedOutcome: vote,
  });

  const [showDetails, setShowDetails] = useState(false);

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && commitmentHash) {
        return sdk.api.tx.court.vote(caseId, commitmentHash);
      }
      return undefined;
    },
    {
      onSuccess: () => {
        commitVote();
        queryClient.invalidateQueries([id, selectedDrawsRootKey, caseId]);
      },
    },
  );

  const onClickDownloadSeed = () => {
    downloadBackup();
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <div className="flex center bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Vote</h3>
      </div>
      <div className="py-6 px-2 text-center">
        <div className="mb-8 mt-6">
          <MarketContextActionOutcomeSelector
            market={market}
            selected={vote}
            options={outcomeAssets}
            disabled={committed}
            onChange={(assetId) => {
              setVote(assetId as CategoricalAssetId);
            }}
          />
        </div>

        <div className="rounded-lg p-5 mb-6 bg-provincial-pink text-sm w-full font-normal">
          <div className="mb-4">
            <div className="mb-3 text-sm text-gray-700">
              <div className="mb-3">
                Your vote is secret and can only be revealed when the vote
                period ends. For this a secret salt has been generated for you
                that is needed when revealing the vote.
              </div>
              <div>
                This is stored locally for you in your browser and will be
                automatically used when its time to reveal your vote.
              </div>
            </div>
            <b>But please download a backup before proceeding.</b>
          </div>

          <div className="center mb-2">
            <button
              className="center gap-3 bg-purple-500 text-white py-2 px-4 rounded-md"
              onClick={onClickDownloadSeed}
            >
              Download Salt Seed Backup
              <HiOutlineDocumentDownload size={14} />
            </button>
          </div>

          <div
            className="center text-gray-500 text-xs gap-2 cursor-pointer"
            onClick={() => setShowDetails(true)}
          >
            Show Details <AiOutlineEye size={12} />
          </div>
          <Modal open={showDetails} onClose={() => setShowDetails(false)}>
            <Dialog.Panel className="w-full max-w-[762px] p-6 rounded-[10px] bg-white">
              <h3 className="mb-2">Salt Seed Backup</h3>
              <p className="mb-3 text-sm">
                This is the content of the downloaded backup.
              </p>
              <pre className="mb-5 text-xs">
                {JSON.stringify(phraseStorage, undefined, 2)}
              </pre>
              <h3 className="mb-2 text-base">Commitment Hash</h3>
              <p className="text-sm mb-4">
                The commitment hash is calculated using a combination of your
                account, the outcome you are voting for and a salt generated
                from the secret phrase.
              </p>
              <code className="block mb-4 text-xs">
                <span>
                  vote_item = VoteItem::Outcome(OutcomeReport::Categorical(
                  {vote.CategoricalOutcome[1]})) {"->"}{" "}
                  {market.categories?.[vote.CategoricalOutcome[1]].ticker}
                </span>
                <br />
                <span className="text-black">salt</span> ={" "}
                <span className="text-blue-400">BlakeTwo256Hash</span>(phrase){" "}
                {"->"} <span className="text-xxs">{u8aToHex(salt)}</span>
                <br />
                <br />
                <span className="text-black">commitmentHash</span> ={" "}
                <span className="text-blue-400">BlakeTwo256Hash</span>(juror,
                vote_item, salt)
              </code>
              <div className="mb-4 text-xs flex items-center gap-2 text-blue-400 pl-2">
                <FaArrowRight size={12} />
                {commitmentHash && u8aToHex(commitmentHash)}
              </div>
            </Dialog.Panel>
          </Modal>
        </div>

        {/* <div className="text-xxs">{u8aToHex(commitmentHash)}</div> */}

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting || !isBackedUp}
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isLoading || isBroadcasting}
          onClick={() => send()}
        >
          <div>
            <div className="center font-normal h-[20px]">
              {!isBackedUp
                ? "Please backup salt seed to proceed"
                : "Place A Vote"}
            </div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
