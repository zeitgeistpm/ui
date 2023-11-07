import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { IOCourtSaltPhraseSeed } from "lib/state/court/phrase-seed";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { useWallet } from "lib/state/wallet";
import React, { useState } from "react";

export type CourtVoteRevealFormProps = {
  caseId: number;
  market: FullMarketFragment;
};

export const CourtVoteRevealForm: React.FC<CourtVoteRevealFormProps> = ({
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

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(() => {
    if (isRpcSdk(sdk) && commitmentHash) {
      return sdk.api.tx.court.revealVote(
        caseId,
        {
          Outcome: {
            Categorical: selectedOutcome.CategoricalOutcome[1],
          },
        },
        commitmentHash,
      );
    }
    return undefined;
  });

  const onSeedDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onSeedDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const item = e.dataTransfer.items[0];
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        const data = JSON.parse(await file?.text());
        const a = IOCourtSaltPhraseSeed.safeParse(data);
        if (a.success) {
          setPhraseSeed(a.data.phrase);
        }
      }
    }
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <div className="flex center bg-fog-of-war py-3">
        <h3 className="text-green-400 text-opacity-50">Reveal Vote</h3>
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
          <div
            className="relative w-full bg-transparent text-center font-semibold rounded-md   border-black border-opacity-30 resize-none"
            onDragOver={onSeedDragOver}
            onDrop={onSeedDrop}
          >
            <div className="py-5 border-t-1 border-l-1 border-r-1 px-4t rounded-t-md border-gray-500">
              {phraseSeed}
            </div>

            <div className="flex items-center cursor-pointer justify-end w-full px-3 mb-2 bg-slate-100 rounded-b-md py-2 border-t-1 over border-1 border-gray-400">
              <div className="flex-1 text-left text-xxs text-gray-500 italic">
                Drop backup of seed file to restore
              </div>
            </div>
          </div>
        </div>

        <TransactionButton
          disabled={!isReady || isLoading || isBroadcasting}
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isLoading || isBroadcasting}
        >
          <div>
            <div className="center font-normal h-[20px]">Reveal Vote</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
