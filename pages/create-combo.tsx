import ComboMarketEditor from "components/create/editor/ComboEditor";
import { GetServerSideProps, NextPage } from "next";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { GraphQLClient } from "graphql-request";
import { MarketOrderByInput, MarketStatus } from "@zeitgeistpm/indexer";
import { activeMarketsKey } from "lib/hooks/queries/useMarketSearch";
import { endpointOptions, graphQlEndpoint, isWSX, wsxID } from "lib/constants";

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
    // Use GraphQL client directly instead of initializing SDK
    const client = new GraphQLClient(graphQlEndpoint);
    
    // Generate the same cache key that client-side hooks will use
    const endpoints = endpointOptions.map((e) => e.value);
    const sdkId = `${endpoints.join(",")}:${graphQlEndpoint}`;
    
    // Fetch active markets directly via GraphQL
    const response = await client.request<{ markets: any[] }>(`
      query GetActiveMarkets {
        markets(
          where: {
            AND: [
              ${isWSX ? `{ baseAsset_eq: "{\\"foreignAsset\\":${wsxID}}" }` : `{ baseAsset_not_eq: "{\\"foreignAsset\\":${wsxID}}" }`}
              { status_eq: Active }
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