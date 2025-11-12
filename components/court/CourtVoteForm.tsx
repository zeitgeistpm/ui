import { Dialog } from "@headlessui/react";
import { u8aToHex } from "@polkadot/util";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { FaArrowRight } from "react-icons/fa";
import { HiOutlineDocumentDownload } from "react-icons/hi";

export type CourtVoteFormProps = {
  caseId: number;
  market: FullMarketFragment;
  onVote?: () => void;
};

export const CourtVoteForm: React.FC<CourtVoteFormProps> = ({
  caseId,
  market,
  onVote,
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
        queryClient.invalidateQueries([id, voteDrawsRootKey, caseId]);
        queryClient.invalidateQueries([id, voteDrawsRootKey]);
        onVote?.();
      },
    },
  );

  const onClickDownloadSeed = () => {
    downloadBackup();
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white/10 shadow-lg backdrop-blur-md">
      <div className="center flex bg-white/10 py-3 backdrop-blur-sm">
        <h3 className="text-white/90">Vote</h3>
      </div>
      <div className="px-2 py-6 text-center">
        <div className="mb-8 mt-6">
          <MarketContextActionOutcomeSelector
            market={market}
            selected={vote ?? outcomeAssets[0]}
            options={outcomeAssets}
            disabled={committed}
            onChange={(assetId) => {
              setVote(assetId as CategoricalAssetId);
            }}
          />
        </div>

        <div className="mb-6 w-full rounded-lg bg-white/10 p-5 text-sm font-normal backdrop-blur-sm">
          <div className="mb-4">
            <div className="mb-3 text-sm text-white/90">
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
              className="center gap-3 rounded-md bg-purple-500 px-4 py-2 text-white/90"
              onClick={onClickDownloadSeed}
            >
              Download Salt Seed Backup
              <HiOutlineDocumentDownload size={14} />
            </button>
          </div>

          <div
            className="center cursor-pointer gap-2 text-xs text-gray-500"
            onClick={() => setShowDetails(true)}
          >
            Show Details <AiOutlineEye size={12} />
          </div>
          <Modal open={showDetails} onClose={() => setShowDetails(false)}>
            <Dialog.Panel className="relative w-full max-w-[762px] overflow-hidden rounded-[10px] bg-white/10 backdrop-blur-lg">
              <div className="p-6">
                <h3 className="mb-2 text-white/90">Commitment Hash</h3>
                <p className="mb-4 text-sm text-white/90">
                  The commitment hash is calculated using a combination of your
                  account, the outcome you are voting for and a salt generated
                  from the secret phrase.
                </p>
                <p className="mb-4 text-sm text-white/90">
                  This is supplied to the chain instead of the direct outcome
                  when voting, so that the vote is not known to other
                  participants. Yet ensures that when its revealed it can be
                  verified that the committed vote and what was revealed was
                  correct.
                </p>
                <code className="mb-4 block text-xs text-white/90">
                  <span>
                    vote_item = VoteItem::Outcome(OutcomeReport::Categorical(
                    {vote?.CategoricalOutcome[1] ?? "null"})) {"->"}{" "}
                    {vote
                      ? market.categories?.[vote.CategoricalOutcome[1]]?.ticker
                      : "--"}
                  </span>
                  <br />
                  <span className="text-black">salt</span> ={" "}
                  <span className="text-blue-400">BlakeTwo256Hash</span>
                  (secretPhrase) {"->"}{" "}
                  <span className="text-xxs">{u8aToHex(salt)}</span>
                  <br />
                  <br />
                  <span className="text-black">commitmentHash</span> ={" "}
                  <span className="text-blue-400">BlakeTwo256Hash</span>(juror,
                  vote_item, salt)
                </code>
                <div className="mb-4 flex items-center gap-2 pl-2 text-xs text-blue-400">
                  <FaArrowRight size={12} />
                  {commitmentHash && u8aToHex(commitmentHash)}
                </div>
                <h3 className="mb-2 text-base text-white/90">
                  Salt Seed Backup
                </h3>
                <p className="mb-3 text-sm text-white/90">
                  This is the content of the downloadable backup file, and the
                  data used to generate the commitment hash.
                </p>
                <pre className="mb-5 text-xs text-white/70">
                  {JSON.stringify(phraseStorage, undefined, 2)}
                </pre>
              </div>
              <div className="relative h-64 w-full">
                <Image
                  title="Wizard draped in purple robes holding a flaming crypto key."
                  alt="Wizard draped in purple robes holding a flaming crypto key."
                  src={"/crypto_wizard.png"}
                  layout="fill"
                  objectFit="cover"
                />
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
            <div className="center h-[20px] font-normal">
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
