import { ImageResponse } from "@vercel/og";
import { getFallbackImage } from "lib/hooks/useMarketImage";
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

  const urlBase = request.nextUrl.origin;

  const marketId = searchParams.get("marketId");
  const marketUrl = request.nextUrl.clone();
  marketUrl.pathname = `/api/og/${marketId}`;

  const cmsUrl = `${urlBase}/api/cms/market-metadata/batch?marketIds=${JSON.stringify(
    [Number(marketId)],
  )}`;

  const {
    market,
    volume,
    prediction,
    ends,
    currencyMetadata,
  }: MarketImageData = await fetch(marketUrl.href).then((r) => r.json());

  const cmsRes = await fetch(cmsUrl).then((r) => r.json());
  const cmsImageUrl = cmsRes?.[0]?.imageUrl;
  const cmsQuestion = cmsRes?.[0]?.question;

  const fallbackImagePath = `${urlBase}${getFallbackImage(
    market.tags,
    Number(marketId),
  )}`;

  const question = cmsQuestion ?? market?.question;

  if (!question) return;

  const questionClass = question.length > 90 ? "text-4xl" : "text-5xl";

  const [boldFont, regularFont, bg, zeitgeistBadge] = await Promise.all([
    fetch(
      new URL(
        "../../../public/fonts/inter/static/Inter-Bold.ttf",
        import.meta.url,
      ).href,
    ).then((res) => res.arrayBuffer()),
    fetch(
      new URL(
        "../../../public/fonts/inter/static/Inter-Regular.ttf",
        import.meta.url,
      ).href,
    ).then((res) => res.arrayBuffer()),
    fetch(new URL("../../../public/og/bg1.png", import.meta.url)).then((res) =>
      res.arrayBuffer(),
    ),
    fetch(
      new URL("../../../public/og/zeitgeist_badge.png", import.meta.url),
    ).then((res) => res.arrayBuffer()),
  ]);

  const image = (
    <div
      tw="px-16 pt-16 pb-24 text-white/90"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <img
        src={bg as any}
        tw="absolute top-0 left-0"
        style={{
          width: 1200,
          height: 675,
          objectFit: "cover",
        }}
      />
      <div tw="flex flex-col h-full w-full">
        <div tw="flex">
          <img
            style={{
              width: 150,
              height: 150,
              objectFit: "cover",
            }}
            src={cmsImageUrl ?? fallbackImagePath}
            tw="rounded-[5px]"
          />
          <div
            tw={`ml-6 font-bold ${questionClass}`}
            style={{
              maxWidth: "800px",
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.3,
              wordBreak: "break-word",
              overflow: "hidden",
              textOverflow: "ellipsis",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {question}
          </div>
        </div>
        <div tw="flex flex-col mt-10">
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
          {Number(volume) > 0 && (
            <div tw="flex flex-col">
              <h2 tw={`font-bold ${"text-3xl"} font-sans`}>Volume:</h2>
              <div
                tw={`flex ${"text-4xl"}  -mt-1`}
                style={{ color: "#ABC1F9" }}
              >
                {formatNumberCompact(Number(volume))} {currencyMetadata?.name}
              </div>
            </div>
          )}
          <div tw="flex ml-auto mt-4">
            <img
              style={{
                width: 250,
              }}
              src={zeitgeistBadge as any}
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
