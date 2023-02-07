import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { gql } from "graphql-request";
import { useSdkv2 } from "../useSdkv2";

export const accountBondsKey = "account-bonds";

const accountBondsQuery = gql`
  query AccountBonds($address: String) {
    markets(
      where: { creator_eq: $address, bonds_isNull: false }
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

export const useAccountBonds = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, accountBondsKey, address],
    async () => {
      if (isIndexedSdk(sdk) && address) {
        const { markets } = await sdk.indexer.client.request<{
          markets: Market[];
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
