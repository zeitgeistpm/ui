import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const accountBondsKey = "account-bonds";

const accountBondsQuery = gql`
  query AccountBonds($address: String) {
    markets(where: { creator_eq: $address }, orderBy: marketId_DESC) {
      bonds {
        creation {
          isSettled
          value
          who
        }
        oracle {
          isSettled
          value
          who
        }
      }
      creator
      question
      marketId
      period {
        end
      }
    }
  }
`;

type MarketBond = {
  isSettled: boolean;
  value: string;
  who: string;
};

type Market = {
  bonds: {
    creation: MarketBond;
    oracle: MarketBond;
  };
  creator: string;
  question: string;
  marketId: number;
  period: {
    end: string;
  };
};

type BondType = "Creation" | "Oracle";

type BondDetails = {
  marketId: number;
  question: string;
  value: string;
  isSettled: boolean;
  type: BondType;
  marketEnd: Date;
};

export const useAccountBonds = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, accountBondsKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { markets } = await sdk.context.indexer.client.request<{
          markets: Market[];
        }>(accountBondsQuery, {
          address: address,
        });

        const bonds: BondDetails[] = [];

        markets.forEach((market) => {
          if (market.bonds) {
            const creationBond: BondDetails = {
              marketId: market.marketId,
              question: market.question,
              value: market.bonds.creation.value,
              isSettled: market.bonds.creation.isSettled,
              type: "Creation",
              marketEnd: new Date(Number(market.period.end)),
            };
            const oracleBond: BondDetails = {
              marketId: market.marketId,
              question: market.question,
              value: market.bonds.oracle.value,
              isSettled: market.bonds.oracle.isSettled,
              type: "Oracle",
              marketEnd: new Date(Number(market.period.end)),
            };

            bonds.push(creationBond, oracleBond);
          }
        });

        return bonds;
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && address),
    },
  );

  return query;
};
