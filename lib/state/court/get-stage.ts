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
  court: ZrmlCourtCourtInfo,
): CourtStage => {
  const currentBlock = time.block;

  const voteStart = court.roundEnds.preVote.toNumber() + 1;
  const voteEnd = court.roundEnds.vote.toNumber();

  const aggregationStart = voteEnd + 1;
  const aggregationEnd = court.roundEnds.aggregation.toNumber();

  const appealStart = aggregationEnd + 1;
  const appealEnd = court.roundEnds.appeal.toNumber();

  if (court.status.isClosed) {
    return {
      type: "closed",
      remainingBlocks: infinity,
      totalTime: infinity,
    };
  }

  if (court.status.isReassigned) {
    return {
      type: "reassigned",
      remainingBlocks: infinity,
      totalTime: infinity,
    };
  }

  if (currentBlock < voteStart) {
    const disputedAt =
      market.disputes?.[0]?.at ?? dateBlock(time, new Date(market.period.end));

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
