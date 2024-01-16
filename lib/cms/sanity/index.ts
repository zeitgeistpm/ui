import { createClient, type ClientConfig } from "@sanity/client";
import { environment } from "lib/constants";

const PROJECT_ID = process.env["NEXT_PUBLIC_SANITY_PROJECT_ID"];
const VERSION = process.env["NEXT_PUBLIC_SANITY_VERSION"];

const DATASET = environment === "production" ? "mainnet" : "bsr";

const config: ClientConfig = {
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: VERSION, // use current date (YYYY-MM-DD) to target the latest API version
};

export const sanity = createClient(config);
