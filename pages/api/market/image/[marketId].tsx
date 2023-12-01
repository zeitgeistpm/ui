import { ImageResponse } from "@vercel/og";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { formatNumberCompact } from "lib/util/format-compact";
import type { PageConfig } from "next";
import { Readable } from "node:stream";
import fs from "fs";
import path from "path";

export const config: PageConfig = {
  runtime: "nodejs",
};

import { NextApiRequest, NextApiResponse } from "next";
import { create } from "@zeitgeistpm/indexer";
import { graphQlEndpoint } from "lib/constants";
import { getCmsMarketMetadataFormMarket } from "lib/cms/get-market-metadata";
import { CATEGORY_IMAGES } from "lib/constants/category-images";
import { seededChoice } from "lib/util/random";

const sdkPromise = create({
  uri: graphQlEndpoint,
});

export default async function MarketImage(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const sdk = await sdkPromise;
  const { marketId } = request.query;

  const { markets } = await sdk.markets({
    where: {
      marketId_eq: Number(marketId),
    },
  });

  const market = markets[0];

  if (!market) {
    return response
      .status(404)
      .json({ error: `No market found by id ${marketId}` });
  }

  const cmsData = await getCmsMarketMetadataFormMarket(market.marketId);

  if (cmsData?.imageUrl) {
    const image = await fetch(cmsData.imageUrl);
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=600, stale-while-revalidate=259200",
    );
    response.setHeader(
      "Content-Type",
      image.headers.get("content-type") ?? "image/png",
    );
    response.setHeader(
      "Content-Length",
      image.headers.get("content-length") ?? "0",
    );
    if (image.body) {
      Readable.fromWeb(image.body as any).pipe(response);
    }
  } else {
    const firstTag = market.tags?.[0];

    const category = (
      firstTag && firstTag in CATEGORY_IMAGES ? firstTag : "untagged"
    ) as keyof typeof CATEGORY_IMAGES;

    const fallback = seededChoice(
      `${market.marketId}`,
      CATEGORY_IMAGES[category],
    );

    const filePath = path.resolve(".", `public/${fallback}`);
    const imageBuffer = fs.readFileSync(filePath);

    response.setHeader("Content-Type", "image/jpg");
    response.send(imageBuffer);
  }
}

// export default async function MarketImage(request: NextRequest) {
//   console.log("IMAGE REQUEST");
//   const image = await fetch(
//     new URL(new URL("/category/zeitgeist.png", request.url), import.meta.url)
//       .href,
//   ).then((res) => res.arrayBuffer());

//   return new ImageResponse(
//     (
//       <img
//         src={image as any}
//         style={{
//           width: 640,
//           height: 640,
//           objectFit: "cover",
//         }}
//       />
//     ),
//     {
//       headers: {
//         "Content-Type": "image/png",
//       },
//       width: 640,
//       height: 640,
//     },
//   );
// }
