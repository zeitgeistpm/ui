import { useQuery } from "@tanstack/react-query";
import { BaseAssetId, isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";
import { hiddenMarketIds } from "lib/constants/markets";

export const accountBondsKey = "account-bonds";

const accountBondsQuery = gql`
  query AccountBonds($address: String) {
    markets(
      where: {
        creator_eq: $address
        bonds_isNull: false
        question_not_eq: ""
        question_isNull: false
        isMetaComplete_eq: true
        marketId_not_in: ${hiddenMarketIds}
      }
      orderBy: marketId_DESC
    ) {
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
      baseAsset
      period {
        end
      }
    }
  }
`;

type Bond = {
  isSettled: boolean;
  value: string;
  who: string;
};

export type MarketBond = {
  bonds: {
    creation: Bond;
    oracle: Bond;
  };
  creator: string;
  question: string;
  marketId: number;
  period: {
    end: string;
  };
  baseAsset: string;
};

export const useAccountBonds = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, accountBondsKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { markets } = await sdk.indexer.client.request<{
          markets: MarketBond[];
        }>(accountBondsQuery, {
          address: address,
        });

        return markets;
      }
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && isIndexedSdk(sdk) && address),
    },
  );

  return query;
};
