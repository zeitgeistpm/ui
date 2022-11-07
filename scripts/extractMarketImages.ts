import { gql, GraphQLClient } from "graphql-request";
import fs from "fs";
import path from "path";

const client = new GraphQLClient(
  "https://processor.rpc-0.zeitgeist.pm/graphql",
);

const allMarketsQuery = gql`
  query MyQuery {
    markets(orderBy: marketId_ASC) {
      img
      marketId
    }
  }
`;

async function getAllMarketImages(): Promise<
  {
    marketId: number;
    img: string | null;
  }[]
> {
  const res = await client.request<{
    markets: { marketId: number; img: string | null }[];
  }>(allMarketsQuery);
  return res.markets;
}

(async () => {
  const data = await getAllMarketImages();
  const imagesDir = path.resolve(`${__dirname}`, "images");
  if (fs.existsSync(imagesDir)) {
    fs.rmSync(imagesDir, { recursive: true, force: true });
  }
  fs.mkdirSync(imagesDir);
  for (const entry of data) {
    if (entry.img == null) {
      continue;
    }
    const [typeStr, b64Str] = entry.img.split(";base64,");
    let extension = typeStr.split("/")[1];
    if (extension.startsWith("svg")) {
      extension = "svg";
    }
    const filename = `${entry.marketId}_image.${extension}`;
    fs.writeFile(
      path.join(imagesDir, filename),
      b64Str,
      { encoding: "base64" },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log(`file ${filename} written to images folder`);
        }
      },
    );
  }
})();
