import { createClient, type ClientConfig } from "@sanity/client";

const PROJECT_ID = "4wbnjof1"; // TODO: move to env
const VERSION = "2022-03-07"; // TODO: move to env
const DATA_SET = "bsr"; // TODO: move to env

const config: ClientConfig = {
  projectId: PROJECT_ID,
  dataset: DATA_SET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: VERSION, // use current date (YYYY-MM-DD) to target the latest API version
};

export const sanity = createClient(config);
