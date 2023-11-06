import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useWallet } from "lib/state/wallet";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import React, { useState } from "react";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import {
  CategoricalAssetId,
  MarketOutcomeAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useCourtSalt } from "lib/state/court/useCourtSalt";
import { shortenAddress } from "lib/util";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";

export type CourtVoteFormProps = {
  caseId: number;
  market: FullMarketFragment;
};

export const CourtVoteForm: React.FC<CourtVoteFormProps> = ({
  caseId,
  market,
}) => {
  const wallet = useWallet();
  const { data: courtCase } = useCourtCase(caseId);

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as MarketOutcomeAssetId,
  );

  const [selectedOutcome, setSelectedOutcome] = useState(outcomeAssets[0]);

  const { phrase, salt, setPhrase } = useCourtSalt(market.marketId, caseId);

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
            onChange={(assetId) => {}}
          />
        </div>

        <div className="rounded-lg p-5 mb-4 bg-provincial-pink text-sm w-full font-normal">
          <div className="mb-4 text-sm text-gray-700">
            Your vote is secret and will be revealed at the end of the voting.
            To be able to reveal a phrase has been generated for you and is
            needed when revealing. This is stored for you locally on this
            client. <b>But please save it somewhere safe.</b>
          </div>

          <textarea
            onChange={(e) => {
              setPhrase(e.target.value);
            }}
            className="w-full bg-transparent text-center font-semibold rounded-md border-1 py-4 px-4 border-black border-opacity-30 resize-none"
          >
            {phrase}
          </textarea>
          <div className="text-xxs flex center gap-2">
            <div className="text-gray-600">
              {revealSalt ? salt : shortenAddress(salt)}
            </div>
            <div
              className="cursor-pointer"
              onClick={() => setRevealSalt(!revealSalt)}
            >
              {revealSalt ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
            </div>
          </div>
        </div>

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
