import ComboMarketEditor from "components/create/editor/ComboEditor";
import { GetServerSideProps, NextPage } from "next";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { MarketOrderByInput, MarketStatus } from "@zeitgeistpm/indexer";
import { activeMarketsKey } from "lib/hooks/queries/useMarketSearch";
import { endpointOptions, graphQlEndpoint } from "lib/constants";

const CreateComboMarketPage: NextPage = () => {
  return (
    <div className="mt-10">
      <ComboMarketEditor />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const queryClient = new QueryClient();

  try {
    const client = new GraphQLClient(graphQlEndpoint);
    
    const endpoints = endpointOptions.map((e) => e.value);
    const sdkId = `${endpoints.join(",")}:${graphQlEndpoint}`;
    
    // Filter for markets created from June 20, 2025 onwards
    // This should work in interim until the indexer is updated to include combinatorial markets
    const targetDate = new Date('2025-06-20T00:00:00.000Z');
    const targetDateISO = targetDate.toISOString();

          // Fetch active markets created from June 20, 2025 onwards
    const response = await client.request<{ markets: any[] }>(`
      query GetActiveMarkets {
        markets(
          where: {
            AND: [
              { status_eq: Active }
              { createdAt_gte: "${targetDateISO}" }
            ]
          }
          order: ${MarketOrderByInput.IdDesc}
          limit: 100
        ) {
          marketId
          question
          description
          status
          baseAsset
          createdAt
          categories {
            name
            ticker
          }
          img
        }
      }
    `);

    // Pre-load active markets with the correct cache key
    queryClient.setQueryData([sdkId, activeMarketsKey], response.markets);
    
  } catch (error) {
    console.error("Failed to pre-load markets:", error);
    // Don't fail the page if pre-loading fails, just log the error
  }

  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

export default CreateComboMarketPage;