import { useChainTime } from "lib/state/chaintime";
import { useChainConstants } from "./useChainConstants";
import Decimal from "decimal.js";
import { useSdkv2 } from "../useSdkv2";
import {
  IndexerConfig,
  IndexerContext,
  isIndexedSdk,
  isRpcSdk,
  Sdk,
} from "@zeitgeistpm/sdk";
import { HistoricalAccountBalanceOrderByInput } from "@zeitgeistpm/indexer";
import { useQuery } from "@tanstack/react-query";
import { useConnectedCourtParticipant } from "./court/useConnectedCourtParticipant";

export const courtNextPayoutRootKey = "court-next-payout";

export const useCourtNextPayout = () => {
  const [sdk, id] = useSdkv2();
  const now = useChainTime();
  const { data: constants } = useChainConstants();
  const connectedParticipant = useConnectedCourtParticipant();

  const enabled = isIndexedSdk(sdk) && now && constants && connectedParticipant;

  const query = useQuery(
    [id, courtNextPayoutRootKey, connectedParticipant?.address, now?.block],
    async () => {
      if (enabled) {
        /**
         * @note
         *  last_payout_block(current_block) = floor(current_block / inf_per) * inf_per
         *  next_payout_block(current_block) = last_payout_block(current_block) + inf_per
         */

        const currentBlock = new Decimal(now.block);

        const inflationPeriod = new Decimal(
          constants.court.inflationPeriodBlocks,
        );

        const lastPayoutBlock = new Decimal(currentBlock)
          .div(inflationPeriod)
          .floor()
          .mul(inflationPeriod);

        const nextPayoutBlock = lastPayoutBlock.add(inflationPeriod);

        const participantFirstJoinedAt = await getAccountJoined(
          sdk,
          connectedParticipant.address,
        );

        if (!participantFirstJoinedAt) return null;

        const nextRewardBlock = currentBlock
          .sub(participantFirstJoinedAt)
          .gt(inflationPeriod)
          ? nextPayoutBlock
          : nextPayoutBlock.add(inflationPeriod);

        return {
          nextRewardBlock: nextRewardBlock.toNumber(),
          nextPayoutBlock: nextPayoutBlock.toNumber(),
          lastPayoutBlock: lastPayoutBlock.toNumber(),
        };
      }

      return null;
    },
    {
      enabled: Boolean(enabled),
      keepPreviousData: true,
    },
  );

  return query;
};

const getAccountJoined = async (sdk: Sdk<IndexerContext>, address: string) => {
  const { historicalAccountBalances } =
    await sdk.indexer.historicalAccountBalances({
      where: {
        AND: [
          { accountId_eq: address },
          {
            OR: [
              {
                extrinsic: {
                  name_eq: "Court.join_court",
                },
              },
              {
                extrinsic: {
                  name_eq: "Court.exit_court",
                },
              },
            ],
          },
        ],
      },
      order: HistoricalAccountBalanceOrderByInput.BlockNumberDesc,
    });

  let earliestEligibleJoin: Decimal | null = null;

  for (const event of historicalAccountBalances) {
    if (event.extrinsic?.name === "Court.join_court") {
      earliestEligibleJoin = new Decimal(event.blockNumber);
    }
    if (event.extrinsic?.name === "Court.exit_court") {
      break;
    }
  }

  return earliestEligibleJoin;
};
