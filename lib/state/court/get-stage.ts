import { ZrmlCourtCourtInfo } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { Infinity, infinity } from "@zeitgeistpm/utility/dist/infinity";
import { ChainTime, dateBlock } from "@zeitgeistpm/utility/dist/time";

/**
 * TODO: move to SDK when finalized and working
 */

export type CourtStage =
  | {
      type: "pre-vote" | "vote" | "aggregation" | "appeal";
      remainingBlocks: number;
      totalTime: number;
    }
  | {
      type: "closed" | "reassigned";
      remainingBlocks: Infinity;
      totalTime: Infinity;
    };

export const getCourtStage = (
  time: ChainTime,
  market: FullMarketFragment,
  courtCase: ZrmlCourtCourtInfo,
): CourtStage => {
  const currentBlock = time.block;

  const voteStart = courtCase.roundEnds.preVote.toNumber() + 1;
  const voteEnd = courtCase.roundEnds.vote.toNumber();

  const aggregationStart = voteEnd + 1;
  const aggregationEnd = courtCase.roundEnds.aggregation.toNumber();

  const appealStart = aggregationEnd + 1;
  const appealEnd = courtCase.roundEnds.appeal.toNumber();

  if (courtCase.status.isClosed) {
    return {
      type: "closed",
      remainingBlocks: infinity,
      totalTime: infinity,
    };
  }

  if (courtCase.status.isReassigned) {
    return {
      type: "reassigned",
      remainingBlocks: infinity,
      totalTime: infinity,
    };
  }

  if (currentBlock < voteStart) {
    const disputedAt =
      market.disputes?.[0]?.at ??
      dateBlock(time, new Date(Number(market.period.end)));

    return {
      type: "pre-vote",
      remainingBlocks: voteStart - currentBlock,
      totalTime: voteStart - disputedAt,
    };
  }

  if (currentBlock >= voteStart && currentBlock <= voteEnd) {
    return {
      type: "vote",
      remainingBlocks: voteEnd - currentBlock,
      totalTime: voteEnd - voteStart,
    };
  }

  if (currentBlock >= aggregationStart && currentBlock <= aggregationEnd) {
    return {
      type: "aggregation",
      remainingBlocks: aggregationEnd - currentBlock,
      totalTime: aggregationEnd - aggregationStart,
    };
  }

  if (currentBlock >= appealStart && currentBlock <= appealEnd) {
    return {
      type: "appeal",
      remainingBlocks: appealEnd - currentBlock,
      totalTime: appealEnd - appealStart,
    };
  }

  throw new Error("Invalid court stage. Should not be reachable.");
};
