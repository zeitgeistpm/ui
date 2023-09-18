import { ImageResponse } from "@vercel/og";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { formatNumberCompact } from "lib/util/format-compact";
import type { PageConfig } from "next";
import { NextRequest } from "next/server";
import type { MarketImageData } from "./[marketId]";

export const config: PageConfig = {
  runtime: "edge",
};

export default async function GenerateOgImage(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  if (!searchParams.has("marketId")) {
    return new Response(`no market id in query`, {
      status: 400,
    });
  }

  const marketId = searchParams.get("marketId");

  const url = request.nextUrl.clone();
  url.pathname = `/api/og/${marketId}`;

  const {
    market,
    volume,
    prediction,
    ends,
    currencyMetadata,
  }: MarketImageData = await fetch(url.href).then((r) => r.json());

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

  if (!market?.question) return;

  const questionClass = market.question.length > 90 ? "text-4xl" : "text-5xl";

  const image = (
    <div
      tw="p-16 text-white"
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
      <div tw="flex flex-col h-full w-full">
        <h1 tw={`${questionClass}`} style={{ lineHeight: "1.3em" }}>
          {market.question}
        </h1>
        <div tw="flex flex-col mt-20">
          <h2 tw={`font-bold text-4xl font-sans`}>
            {market.status === "Reported" || market.status === "Resolved"
              ? "Winning Outcome:"
              : "Prediction:"}
          </h2>
          <div tw={`font-semibold ${"text-6xl"} `} style={{ color: "#ABC1F9" }}>
            {prediction.name != null && prediction.name !== ""
              ? market.marketType.categorical
                ? `${prediction.name} (${prediction.percentage}%)`
                : `${Intl.NumberFormat("en-US", {
                    maximumSignificantDigits: 3,
                  }).format(Number(prediction.name))}`
              : "No Prediction"}
          </div>
        </div>
        <div tw="flex mt-auto w-full items-center">
          <div tw="flex flex-col mr-34">
            <h2 tw={`font-bold ${"text-3xl"} font-sans`}>Ends:</h2>
            <div tw="text-4xl -mt-1" style={{ color: "#ABC1F9" }}>
              {ends}
            </div>
          </div>
          <div tw="flex flex-col">
            <h2 tw={`font-bold ${"text-3xl"} font-sans`}>Volume:</h2>
            <div tw={`flex ${"text-4xl"}  -mt-1`} style={{ color: "#ABC1F9" }}>
              {formatNumberCompact(Number(volume))} {currencyMetadata?.name}
            </div>
          </div>
          <div tw="flex ml-auto mt-4">
            <img
              style={{
                width: 250,
              }}
              src={
                new URL(
                  "../../../public/og/zeitgeist_badge.png",
                  import.meta.url,
                ).href
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(image, {
    width: 1200,
    height: 630,
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
