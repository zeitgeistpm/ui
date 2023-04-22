import { ImageResponse } from "@vercel/og";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { formatNumberCompact } from "lib/util/format-compact";
import type { PageConfig } from "next";
import { NextRequest } from "next/server";
import type { MarketImageData } from "./[marketId]";

export const config: PageConfig = {
  runtime: "edge",
};

const getImageUrl = async (image: string | null): Promise<string> => {
  const fallbackUrl = new URL(
    "../../../public/icons/default-market.png",
    import.meta.url,
  ).href;
  if (!image) {
    return fallbackUrl;
  }
  if (isMarketImageBase64Encoded(image)) {
    return image;
  }

  try {
    const url = `https://ipfs-gateway.zeitgeist.pm/ipfs/${image}`;
    const res = await fetch(url, { method: "HEAD" });
    if (res.headers.get("Content-Type")?.startsWith("image") === false) {
      return fallbackUrl;
    }
    return url;
  } catch {
    return fallbackUrl;
  }
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

  const marketImageUrl = await getImageUrl(market.img);

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
      <div tw="flex h-full w-full">
        <div tw="flex flex-col justify-between h-full">
          <div tw="flex">
            <img
              style={{
                width: 180,
                height: 180,
                objectFit: "cover",
              }}
              src={marketImageUrl}
              tw="rounded-[5px]"
            />
          </div>
          <div tw="flex">
            <img
              style={{
                width: 200,
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
        <div tw="flex flex-col h-full ml-[80px]" style={{ width: 750 }}>
          <h1 tw={`${"text-5xl"}`} style={{ lineHeight: "1.3em" }}>
            {market.question}
          </h1>
          <div tw="flex flex-col mt-auto">
            <h2 tw={`font-bold ${"text-3xl"} font-sans`}>
              {market.status === "Reported" || market.status === "Resolved"
                ? "Winning Outcome:"
                : "Prediction:"}
            </h2>
            <div
              tw={`font-semibold ${"text-6xl"} `}
              style={{ color: "#ABC1F9" }}
            >
              {market.marketType.categorical
                ? `${prediction.name} (${prediction.percentage}%)`
                : `${prediction.name}`}
            </div>
          </div>
          <div tw="flex mt-[50px] w-full">
            <div tw="flex flex-col mr-[200px]">
              <h2 tw={`font-bold ${"text-3xl"} font-sans`}>Ends:</h2>
              <div tw="text-2xl -mt-3" style={{ color: "#ABC1F9" }}>
                {ends}
              </div>
            </div>
            <div tw="flex flex-col">
              <h2 tw={`font-bold ${"text-3xl"} font-sans`}>Volume:</h2>
              <div
                tw={`flex ${"text-2xl"}  -mt-3`}
                style={{ color: "#ABC1F9" }}
              >
                {formatNumberCompact(Number(volume))}
                {" ZTG"}
              </div>
            </div>
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
