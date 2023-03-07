import { ImageResponse } from "@vercel/og";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
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

  const { market, volume, prediction, ends }: MarketImageData = await fetch(
    url.href,
  ).then((r) => r.json());

  const marketImage = !market.img
    ? new URL("../../../public/icons/default-market.png", import.meta.url).href
    : isMarketImageBase64Encoded(market.img)
    ? market.img
    : `https://ipfs-gateway.zeitgeist.pm/ipfs/${market.img}`;

  const isTwitter = searchParams.has("twitter");

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
      </div>

      <div tw="flex flex-1 flex-col h-full">
        <h1
          tw={`${isTwitter ? "text-3xl mb-14" : "text-5xl"}`}
          style={{ lineHeight: "1.3em" }}
        >
          {market.question}
        </h1>
        <h2 tw={`font-bold ${isTwitter ? "text-2xl" : "text-3xl"} font-sans`}>
          {market.status === "Reported" || market.status === "Resolved"
            ? "Winning Outcome:"
            : "Prediction:"}
        </h2>
      </div>

      <div tw="flex flex-1 ">
        <img
          tw=""
          style={{
            transform: isTwitter ? "scale(0.4)" : "scale(0.5)",
            transformOrigin: "bottom right",
          }}
          src={
            new URL("../../../public/og/zeitgeist_badge.png", import.meta.url)
              .href
          }
        />

        <div tw="flex flex-col mb-4">
          <div
            tw={`flex ${isTwitter ? "text-1xl" : "text-2xl"} -mt-3`}
            style={{ color: "#ABC1F9" }}
          >
            {market.marketType.categorical
              ? `${prediction.percentage}% — ${prediction.name}`
              : `${prediction.name}`}
          </div>
        </div>

        <div tw="flex flex-col">
          <h2 tw={`font-bold ${isTwitter ? "text-2xl" : "text-3xl"} font-sans`}>
            Volume:
          </h2>
          <div
            tw={`flex ${isTwitter ? "text-1xl" : "text-2xl"}  -mt-3`}
            style={{ color: "#ABC1F9" }}
          >
            {volume}
            {" ZTG"}
          </div>
          <div tw="flex flex-col">
            <h2
              tw={`font-bold ${isTwitter ? "text-2xl" : "text-3xl"} font-sans`}
            >
              Ends:
            </h2>
            <div tw="text-2xl -mt-3" style={{ color: "#ABC1F9" }}>
              {ends}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const newImage = (
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
      <div tw="flex h-full w-full bg-blue-500">
        <div tw="flex flex-col justify-between h-full bg-green-500">
          <div tw="flex bg-red-500">
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
          <div tw="flex bg-red-500">
            <img
              tw=""
              style={{
                width: 200,
                // transform: isTwitter ? "scale(0.4)" : "scale(0.5)",
                // transformOrigin: "bottom right",
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
        <div tw="flex flex-col h-full bg-purple-500 mx-5">
          <h1
            tw={`${isTwitter ? "text-3xl mb-14" : "text-5xl"}`}
            style={{ lineHeight: "1.3em" }}
          >
            {market.question}
          </h1>
          <div tw="flex flex-col">
            <h2
              tw={`font-bold ${isTwitter ? "text-2xl" : "text-3xl"} font-sans`}
            >
              {market.status === "Reported" || market.status === "Resolved"
                ? "Winning Outcome:"
                : "Prediction:"}
            </h2>
            <div
              tw={` ${isTwitter ? "text-1xl" : "text-2xl"} -mt-3`}
              style={{ color: "#ABC1F9" }}
            >
              {market.marketType.categorical
                ? `${prediction.name} (${prediction.percentage}%)`
                : `${prediction.name}`}
            </div>
          </div>
          <div tw="flex">
            <div tw="flex flex-col">
              <h2
                tw={`font-bold ${
                  isTwitter ? "text-2xl" : "text-3xl"
                } font-sans`}
              >
                Volume:
              </h2>
              <div
                tw={`flex ${isTwitter ? "text-1xl" : "text-2xl"}  -mt-3`}
                style={{ color: "#ABC1F9" }}
              >
                {volume}
                {" ZTG"}
              </div>
            </div>
            <div tw="flex flex-col">
              <h2
                tw={`font-bold ${
                  isTwitter ? "text-2xl" : "text-3xl"
                } font-sans`}
              >
                Ends:
              </h2>
              <div tw="text-2xl -mt-3" style={{ color: "#ABC1F9" }}>
                {ends}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(newImage, {
    width: isTwitter ? 800 : 1200,
    height: isTwitter ? 418 : 675,
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
