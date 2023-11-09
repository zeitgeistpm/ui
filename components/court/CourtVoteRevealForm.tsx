import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { u8aToHex } from "@polkadot/util";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useVoteDraws";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { IOCourtSaltPhraseStorage } from "lib/state/court/CourtSaltPhraseStorage";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import { shortenAddress } from "lib/util";
import React, { useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { BsFillFileEarmarkDiffFill } from "react-icons/bs";

export type CourtVoteRevealFormProps = {
  caseId: number;
  market: FullMarketFragment;
  secretVote?: ZrmlCourtDraw["vote"]["asSecret"];
};

export const CourtVoteRevealForm: React.FC<CourtVoteRevealFormProps> = ({
  caseId,
  market,
  secretVote,
}) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const { vote, setVote, committed } = useCourtVote({
    caseId,
    marketId: market.marketId,
    defaultValue: outcomeAssets[0],
  });

  const { salt, setPhraseSeed } = useCourtSalt({
    marketId: market.marketId,
    caseId: caseId,
  });

  const { commitmentHash } = useCourtCommitmentHash({
    salt,
    selectedOutcome: vote,
  });

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && commitmentHash) {
        return sdk.api.tx.court.revealVote(
          caseId,
          {
            Outcome: {
              Categorical: vote.CategoricalOutcome[1],
            },
          },
          commitmentHash,
        );
      }
      return undefined;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, voteDrawsRootKey, caseId]);
      },
    },
  );

  const [hasDroppedFile, setHasDroppedFile] = useState(false);

  const onChangeSelectedOutcome = (assetId: CategoricalAssetId) => {
    setVote(assetId as CategoricalAssetId);
  };

  const onCourtSaltBackupDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onCourtSaltBackupDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const item = e.dataTransfer.items[0];

    if (item.kind === "file") {
      const file = item.getAsFile();

      if (file) {
        const raw = await file?.text();
        const parsed = IOCourtSaltPhraseStorage.safeParse(JSON.parse(raw));

        if (parsed.success) {
          const wasSet = await setPhraseSeed(parsed.data);
          setHasDroppedFile(wasSet);
        }
      }
    }
  };

  const commitmentHashMatches =
    secretVote?.commitment.toHex() === u8aToHex(commitmentHash);

  return (
    <div className="rounded-xl overflow-hidden shadow-lg">
      <div className="flex center bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Reveal Vote</h3>
      </div>
      <div className="py-6 px-2 text-center">
        <div className="mb-8 mt-6">
          <MarketContextActionOutcomeSelector
            market={market}
            selected={vote}
            options={outcomeAssets}
            onChange={onChangeSelectedOutcome}
            disabled={committed}
            hideValue={committed}
          />
        </div>

        {!committed && (
          <>
            <div className="rounded-lg p-5 mb-6 bg-provincial-pink text-sm w-full font-normal">
              <div className="text-sm text-gray-700">
                No local data regarding your vote was found, you have to provide
                the same answer when revealing as when you voted.
              </div>
            </div>
          </>
        )}

        {commitmentHashMatches ? (
          <div
            className="relative w-full bg-transparent text-center font-semibold rounded-md border-black border-opacity-30 resize-none mb-6"
            onDragOver={onCourtSaltBackupDragOver}
            onDrop={onCourtSaltBackupDrop}
          >
            <div className="text-sm gap-3 text-gray-600 bg-green-100 py-6 px-6 rounded-md border-dotted border-2">
              <h3 className="text-sm center gap-2">
                {hasDroppedFile
                  ? "Commitment Hash Match"
                  : "Using locally saved commitment hash"}{" "}
                <AiOutlineCheck />
              </h3>
              <span className="text-xxs italic">
                {shortenAddress(u8aToHex(commitmentHash))}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full bg-transparent text-center font-semibold rounded-md  resize-none mb-6"
            onDragOver={onCourtSaltBackupDragOver}
            onDrop={onCourtSaltBackupDrop}
          >
            <div
              className={`text-sm italic  text-gray-500 bg-slate-100 py-12 px-6 rounded-md border-dotted border-2 ${
                hasDroppedFile && "border-red-500"
              }`}
            >
              <div className="center gap-4">
                <div className="">
                  <div>Drop backup of seed file to restore.</div>
                  <div className="text-xxs">
                    You saved this to your local machine when voting.
                  </div>
                </div>
                <BsFillFileEarmarkDiffFill size={24} />
              </div>
              {hasDroppedFile && (
                <div className="mt-4 text-red-400 text-xxs">
                  Invalid Backup. Hash mismatch.
                </div>
              )}
            </div>
          </div>
        )}

        <TransactionButton
          disabled={
            !isReady || isLoading || isBroadcasting || !commitmentHashMatches
          }
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isLoading || isBroadcasting}
          onClick={() => send()}
        >
          <div>
            <div className="center font-normal h-[20px]">Reveal Vote</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
