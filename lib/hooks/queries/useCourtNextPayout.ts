import { useQuery } from "@tanstack/react-query";
import { HistoricalAccountBalanceOrderByInput } from "@zeitgeistpm/indexer";
import { IndexerContext, isIndexedSdk, Sdk } from "@zeitgeistpm/sdk";
import { blockDate } from "@zeitgeistpm/utility/dist/time";
import Decimal from "decimal.js";
import { useChainTime } from "lib/state/chaintime";
import { useWallet } from "lib/state/wallet";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";

export const courtNextPayoutRootKey = "court-next-payout";

export type CourtPayoutInfo = {
  inflationPeriod: number;
  nextPayoutBlock: number;
  lastPayoutBlock: number;
  nextPayoutDate: Date;
  lastPayoutDate: Date;
};

export type WithPayoutEligibility = CourtPayoutInfo & {
  nextRewardBlock: number;
  nextRewardDate: Date;
};

export const isPayoutEligible = (
  info?: CourtPayoutInfo | WithPayoutEligibility | null,
): info is WithPayoutEligibility =>
  (info as WithPayoutEligibility)?.nextRewardBlock !== undefined;

export const useCourtNextPayout = () => {
  const [sdk, id] = useSdkv2();
  const now = useChainTime();
  const { data: constants } = useChainConstants();
  const wallet = useWallet();

  const enabled = isIndexedSdk(sdk) && now && constants && wallet.realAddress;

  const query = useQuery<CourtPayoutInfo | WithPayoutEligibility | null>(
    [id, courtNextPayoutRootKey, wallet?.realAddress, now?.block],
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
          wallet.realAddress!,
        );

        const courtPayoutInfo: CourtPayoutInfo = {
          inflationPeriod: inflationPeriod.toNumber(),
          nextPayoutBlock: nextPayoutBlock.toNumber(),
          lastPayoutBlock: lastPayoutBlock.toNumber(),
          nextPayoutDate: blockDate(now, nextPayoutBlock.toNumber()),
          lastPayoutDate: blockDate(now, lastPayoutBlock.toNumber()),
        };

        if (participantFirstJoinedAt) {
          const withPayoutEligibility: WithPayoutEligibility = {
            ...courtPayoutInfo,
            nextRewardBlock: nextPayoutBlock.toNumber(),
            nextRewardDate: blockDate(now, nextPayoutBlock.toNumber()),
          };

          return withPayoutEligibility;
        }

        return courtPayoutInfo;
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
                  name_eq: "Court.delegate",
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
  console.log(historicalAccountBalances);
  for (const event of historicalAccountBalances) {
    if (
      event.extrinsic?.name === "Court.join_court" ||
      event.extrinsic?.name === "Court.delegate"
    ) {
      earliestEligibleJoin = new Decimal(event.blockNumber);
    }
    if (event.extrinsic?.name === "Court.exit_court") {
      console.log("EXITED");
      break;
    }
  }

  return earliestEligibleJoin;
};
