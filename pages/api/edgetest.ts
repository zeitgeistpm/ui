import type { NextApiRequest, PageConfig } from "next";

export const config: PageConfig = {
  runtime: "edge",
};

export default (req) => new Response("Hello world!");
