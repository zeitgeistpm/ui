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
import { useWallet } from "lib/state/wallet";
import { download } from "lib/util/download";
import React, { useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { FaArrowDown } from "react-icons/fa";
import { HiOutlineDocumentDownload } from "react-icons/hi";

export type CourtVoteFormProps = {
  caseId: number;
  market: FullMarketFragment;
};

export const CourtVoteForm: React.FC<CourtVoteFormProps> = ({
  caseId,
  market,
}) => {
  const [sdk] = useSdkv2();

  const wallet = useWallet();

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedOutcome, setSelectedOutcome] = useState(outcomeAssets[0]);

  const { phraseSeed, setPhraseSeed, salt, commitmentHash } =
    useCourtCommitmentHash({
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

  const onClickDownloadSeed = () => {
    download(
      `zeitgeist-court[${caseId}]-phrase.txt`,
      JSON.stringify(phraseSeed, undefined, 2),
    );
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
            selected={selectedOutcome}
            options={outcomeAssets}
            onChange={(assetId) => {
              setSelectedOutcome(assetId as CategoricalAssetId);
            }}
          />
        </div>

        <div className="rounded-lg p-5 mb-6 bg-provincial-pink text-sm w-full font-normal">
          <div className="mb-4">
            <div className="mb-2 text-sm text-gray-700">
              Your vote is secret and can only be revealed at the end of the
              voting. When revealing you need to provide the secret phrase you
              see below. It is stored locally in this browser client for you.
            </div>
            <b>
              But please save it somewhere safe so it can be restored in case
              you change browser or clear cache.
            </b>
          </div>

          <div className="relative w-full bg-transparent text-center font-semibold rounded-md   border-black border-opacity-30 resize-none">
            <div className="py-5 border-t-1 border-l-1 border-r-1 px-4 rounded-t-md border-gray-500">
              {phraseSeed}
            </div>

            <div
              className="flex items-center cursor-pointer justify-end w-full px-3 mb-2 bg-slate-100 rounded-b-md py-2 border-t-1 over border-1 border-gray-400"
              onClick={onClickDownloadSeed}
            >
              <div className="flex-1 text-left text-xxs text-gray-500 italic">
                Download seed backup
              </div>
              <HiOutlineDocumentDownload size={14} />
            </div>
          </div>

          <div
            className="center text-gray-500 text-xs gap-2 cursor-default"
            onClick={() => setShowDetails(true)}
          >
            Show Details <AiOutlineEye size={12} />
          </div>
          <Modal open={showDetails} onClose={() => setShowDetails(false)}>
            <Dialog.Panel className="w-full max-w-[662px] p-6 rounded-[10px] bg-white">
              <h3 className="mb-2">Commitment Hash</h3>
              <p className="text-sm mb-4">
                The commitment hash is calculated using a combination of your
                account, the outcome you are voting for and a salt generated
                from the secret phrase.
              </p>
              <code className="block mb-4 text-xs">
                <span>juror = {wallet?.realAddress}</span>
                <br />
                <span>
                  vote_item = VoteItem::Outcome(OutcomeReport::Categorical(
                  {selectedOutcome.CategoricalOutcome[1]}))
                </span>
                <br />
                <span>salt = {u8aToHex(salt)}</span>
                <br />
                <br />
                <span className="text-black">commitmentHash</span> ={" "}
                <span className="text-blue-400">BlakeTwo256Hash</span>(juror,
                vote_item, salt)
              </code>
              <div className="mb-4 text-blue-400">
                <FaArrowDown size={12} />
              </div>
              <div className="text-xs text-blue-400">
                {commitmentHash && u8aToHex(commitmentHash)}
              </div>
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
