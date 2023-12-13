import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { u8aToHex } from "@polkadot/util";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { IOCourtSaltPhraseStorage } from "lib/state/court/CourtSaltPhraseStorage";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { CourtSalt, useCourtSalt } from "lib/state/court/useCourtSalt";
import { useCourtVote } from "lib/state/court/useVoteOutcome";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { createCourtCommitmentHash } from "lib/util/create-vote-commitment-hash";
import React, { useRef, useState } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { BsFillFileEarmarkDiffFill } from "react-icons/bs";
import { HexString } from "@polkadot/util/types";

export type CourtVoteRevealFormProps = {
  caseId: number;
  market: FullMarketFragment;
  secretVote?: ZrmlCourtDraw["vote"]["asSecret"];
};

const useOutcomeMatchingCommitmentHash = (
  salt: CourtSalt,
  commitmentHash: HexString,
  outcomeAssets: CategoricalAssetId[],
) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  if (isRpcSdk(sdk) && wallet.realAddress) {
    const outcome = outcomeAssets.find((assetId) => {
      const assetHash = createCourtCommitmentHash(
        sdk,
        wallet.realAddress!,
        assetId,
        salt,
      );
      return u8aToHex(assetHash) === commitmentHash;
    });

    return outcome;
  }
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

  const { salt, restoreBackup } = useCourtSalt({
    marketId: market.marketId,
    caseId: caseId,
  });

  const matchingOutcome = useOutcomeMatchingCommitmentHash(
    salt,
    secretVote?.commitment.toHex() ?? `0x`,
    outcomeAssets,
  );

  const { commitmentHash } = useCourtCommitmentHash({
    salt,
    selectedOutcome: matchingOutcome ?? vote,
  });

  const { send, isReady, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && salt && vote) {
        const assetIndex =
          matchingOutcome?.CategoricalOutcome[1] ?? vote.CategoricalOutcome[1];
        return sdk.api.tx.court.revealVote(
          caseId,
          {
            Outcome: {
              Categorical: assetIndex,
            },
          },
          salt,
        );
      }
      return undefined;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, voteDrawsRootKey, caseId]);
        queryClient.invalidateQueries([id, voteDrawsRootKey, "all"]);
      },
    },
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      processFile(file);
    }
  };

  const onFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    await processFile(file);
  };

  const processFile = async (file: File | null | undefined) => {
    if (file) {
      const raw = await file.text();
      const parsed = IOCourtSaltPhraseStorage.safeParse(JSON.parse(raw));

      if (parsed.success) {
        const wasSet = await restoreBackup(parsed.data);
        setHasDroppedFile(wasSet);
      }
    }
  };

  const commitmentHashMatches =
    secretVote?.commitment.toHex() === u8aToHex(commitmentHash);

  return (
    <div className="overflow-hidden rounded-xl shadow-lg">
      <div className="center flex bg-fog-of-war py-3">
        <h3 className="text-gray-300 text-opacity-50">Reveal Vote</h3>
      </div>
      <div className="px-2 py-6 text-center">
        <div className="mb-8 mt-6">
          <MarketContextActionOutcomeSelector
            market={market}
            selected={matchingOutcome ?? vote ?? outcomeAssets[0]}
            options={outcomeAssets}
            onChange={onChangeSelectedOutcome}
            disabled={Boolean(committed || matchingOutcome)}
            hideValue={Boolean(committed || matchingOutcome)}
          />
        </div>

        {!committed && !matchingOutcome && (
          <>
            <div className="mb-6 w-full rounded-lg bg-provincial-pink p-5 text-sm font-normal">
              <div className="text-sm text-gray-700">
                No local data regarding your vote was found, you have to provide
                the same answer when revealing as when you voted.
              </div>
            </div>
          </>
        )}

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={onFileInputChange}
        />

        {commitmentHashMatches || matchingOutcome ? (
          <div
            className="relative mb-6 w-full resize-none rounded-md border-black border-opacity-30 bg-transparent text-center font-semibold"
            onDragOver={onCourtSaltBackupDragOver}
            onDrop={onCourtSaltBackupDrop}
          >
            <div className="gap-3 rounded-md border-2 border-dotted bg-green-100 px-6 py-6 text-sm text-gray-600">
              <h3 className="center gap-2 text-sm">
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
            className="relative mb-6 w-full cursor-pointer resize-none rounded-md bg-transparent  text-center font-semibold"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onCourtSaltBackupDragOver}
            onDrop={onCourtSaltBackupDrop}
          >
            <div
              className={`rounded-md border-2  border-dotted bg-slate-100 px-6 py-12 text-sm italic text-gray-500 ${
                hasDroppedFile && "border-red-500"
              }`}
            >
              <div className="center gap-4">
                <div className="">
                  <div>Click or drop backup of seed file to restore.</div>
                  <div className="text-xxs">
                    You saved this to your local machine when voting.
                  </div>
                </div>
                <BsFillFileEarmarkDiffFill size={24} />
              </div>
              {hasDroppedFile && (
                <div className="mt-4 text-xxs text-red-400">
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
            <div className="center h-[20px] font-normal">Reveal Vote</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
