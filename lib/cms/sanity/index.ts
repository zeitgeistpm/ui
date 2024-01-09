import { createClient, type ClientConfig } from "@sanity/client";
import { environment } from "lib/constants";

const PROJECT_ID = "4wbnjof1";
const VERSION = "2022-03-07";
const DATASET = environment === "production" ? "mainnet" : "bsr";

const config: ClientConfig = {
  projectId: PROJECT_ID,
  dataset: DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: VERSION, // use current date (YYYY-MM-DD) to target the latest API version
};

export const sanity = createClient(config);
