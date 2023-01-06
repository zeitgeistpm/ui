import { ImageResponse } from "@vercel/og";
import { GraphQLClient } from "graphql-request";
import { getMarket } from "lib/gql/markets";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "experimental-edge",
};

export default async function (
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("marketId")) {
    return new Response(`no market id in query`, {
      status: 400,
    });
  }

  const marketId = searchParams.get("marketId");

  const client = new GraphQLClient(process.env.NEXT_PUBLIC_SSR_INDEXER_URL, {
    fetch,
  });

  const market = await getMarket(client, marketId as string);

  if (!market) {
    return new Response(`no market found by id ${marketId}`, {
      status: 404,
    });
  }

  const image = (
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div tw="bg-gray-50">{market.status}</div>
    </div>
  );

  return new ImageResponse(image, {
    width: 1200,
    height: 600,
  });
}
