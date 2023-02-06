import type { NextApiRequest, PageConfig } from "next";
import { ImageResponse } from "@vercel/og";

export const config: PageConfig = {
  runtime: "edge",
};

export default (req) => {
  const a = new ImageResponse(<div>wat</div>, {
    width: 1200,
    height: 675,
  });
  return a;
};
