import { u8aToHex } from "@polkadot/util";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { CategoricalAssetId, parseAssetId } from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useCourtCommitmentHash } from "lib/state/court/useCourtCommitmentHash";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

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
  const { data: courtCase } = useCourtCase(caseId);

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

  const [revealSalt, setRevealSalt] = useState(false);

  const { isLoading, isBroadcasting } = useExtrinsic(() => {
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

          <div className="w-full bg-transparent text-center font-semibold rounded-md border-1 py-4 px-4 border-black border-opacity-30 resize-none">
            {phrase}
          </div>
          <div className="text-xxs flex center gap-2">
            <div className="text-gray-600">
              {revealSalt ? u8aToHex(salt) : shortenAddress(u8aToHex(salt))}
            </div>
            <div
              className="cursor-pointer"
              onClick={() => setRevealSalt(!revealSalt)}
            >
              {revealSalt ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
            </div>
          </div>
        </div>

        <div className="text-xxs">{u8aToHex(commitmentHash)}</div>

        <TransactionButton
          disabled={false}
          className={`relative h-[56px] ${isLoading && "animate-pulse"}`}
          type="submit"
          loading={isBroadcasting}
        >
          <div>
            <div className="center font-normal h-[20px]">Place A Vote</div>
          </div>
        </TransactionButton>
      </div>
    </div>
  );
};
