import { ImageResponse } from "@vercel/og";
import absoluteUrl from "next-absolute-url";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import type { NextApiRequest, NextConfig } from "next";

export const config = {
  runtime: "experimental-edge",
};

const boldFont = fetch(
  new URL("../../../public/fonts/inter/static/Inter-Bold.ttf", import.meta.url)
    .href,
).then((res) => res.arrayBuffer());

const regularFont = fetch(
  new URL(
    "../../../public/fonts/inter/static/Inter-Regular.ttf",
    import.meta.url,
  ).href,
).then((res) => res.arrayBuffer());

export default async function (request: NextApiRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("marketId")) {
    return new Response(`no market id in query`, {
      status: 400,
    });
  }

  const marketId = searchParams.get("marketId");

  const { market, volume, prediction, ends } = await fetch(
    `${absoluteUrl(request, "localhost:3000").origin}/api/og/${marketId}`,
  ).then((r) => r.json());

  const marketImage = !market.img
    ? new URL("../../../public/icons/default-market.png", import.meta.url).href
    : isMarketImageBase64Encoded(market.img)
    ? market.img
    : `https://ipfs-gateway.zeitgeist.pm/ipfs/${market.img}`;

  const boldFontData = await boldFont;
  const regularFontData = await regularFont;

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
              ? `${prediction.percentage}% — ${prediction.outcome}`
              : `${prediction.outcome}`}
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
        data: regularFontData,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: boldFontData,
        weight: 700,
        style: "normal",
      },
    ],
  });
}
