import { ImageResponse } from "@vercel/og";
import { create } from "@zeitgeistpm/indexer";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import type { NextApiRequest, NextConfig, PageConfig } from "next";
import { getCurrentPrediction } from "lib/util/assets";
import Decimal from "decimal.js";
import moment from "moment";
import { ZTG } from "lib/constants";

export const config: PageConfig = {
  runtime: "edge",
};

const sdkPromise = create({
  uri: process.env.NEXT_PUBLIC_SSR_INDEXER_URL,
});

export default async function GenerateOgImage(request: NextApiRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("marketId")) {
    return new Response(`no market id in query`, {
      status: 400,
    });
  }

  const marketId = searchParams.get("marketId");

  const sdk = await sdkPromise;

  const { markets } = await sdk.markets({
    where: {
      marketId_eq: Number(marketId),
    },
  });

  const market = markets[0];

  if (!market) {
    return new Response(`no market found by id ${marketId}`, {
      status: 404,
    });
  }

  let prediction: { name: string; price: number; percentage: number } = {
    name: "No Prediction",
    percentage: 0,
    price: 0,
  };

  if (market.pool) {
    const { assets } = await sdk.assets({
      where: {
        poolId_eq: market.pool.poolId,
      },
    });

    prediction = getCurrentPrediction(assets as any, market as any);
  }

  const volume = new Decimal(market.pool?.volume).div(ZTG).toFixed(2);

  const ends = moment(Number(market.period.end)).format("MMM Do, YYYY");

  const marketImage = !market.img
    ? new URL("../../../public/icons/default-market.png", import.meta.url).href
    : isMarketImageBase64Encoded(market.img)
    ? market.img
    : `https://ipfs-gateway.zeitgeist.pm/ipfs/${market.img}`;

  const boldFont = await fetch(
    new URL(
      "../../../public/fonts/inter/static/Inter-Bold.ttf",
      import.meta.url,
    ).href,
  ).then((res) => res.arrayBuffer());

  const regularFont = await fetch(
    new URL(
      "../../../public/fonts/inter/static/Inter-Regular.ttf",
      import.meta.url,
    ).href,
  ).then((res) => res.arrayBuffer());

  const image = (
    <div
      tw="p-12 text-white"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <img
        src={new URL("../../../public/og/bg1.png", import.meta.url).href}
        tw="absolute top-0 left-0"
        style={{
          width: 1200,
          height: 675,
          objectFit: "cover",
        }}
      />

      <div tw="flex flex-col h-full mr-20">
        <div tw="flex flex-1">
          <img
            style={{
              width: 140,
              height: 140,
              objectFit: "cover",
              borderRadius: "100%",
            }}
            src={marketImage}
          />
        </div>
        <div tw="flex flex-col">
          <h2 tw="font-bold text-3xl font-sans">Ends:</h2>
          <div tw="text-2xl -mt-3" style={{ color: "#ABC1F9" }}>
            {ends}
          </div>
        </div>
      </div>

      <div tw="flex flex-1 pr-30 flex-col h-full">
        <h1 tw="text-5xl mb-20" style={{ lineHeight: "1.3em" }}>
          {market.question}
        </h1>

        <div tw="flex flex-col flex-1">
          <h2 tw="font-bold text-4xl font-sans">
            {market.status === "Reported" || market.status === "Resolved"
              ? "Winning Outcome:"
              : "Prediction:"}
          </h2>
          <div tw="text-3xl -mt-3" style={{ color: "#ABC1F9" }}>
            {market.marketType.categorical
              ? `${prediction.percentage}% — ${prediction.name}`
              : `${prediction.name}`}
          </div>
        </div>

        <div tw="flex flex-col">
          <h2 tw="font-bold text-3xl font-sans">Volume:</h2>
          <div tw="flex text-2xl -mt-3" style={{ color: "#ABC1F9" }}>
            {volume}
            {" ZTG"}
          </div>
        </div>
      </div>

      <img
        tw="absolute bottom-12 right-12"
        style={{
          transform: "scale(0.5)",
          transformOrigin: "bottom right",
        }}
        src={
          new URL("../../../public/og/zeitgeist_badge.png", import.meta.url)
            .href
        }
      />
    </div>
  );

  return new ImageResponse(image, {
    width: 1200,
    height: 675,
    fonts: [
      {
        name: "Inter",
        data: regularFont,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: boldFont,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
