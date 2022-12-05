import { MarketCreation, ScalarRangeType } from "@zeitgeistpm/sdk/dist/types";
import { MarketStatus } from "lib/types/markets";

export type MarketCardData = {
  id: number;
  type: "scalar" | "categorical";
  creation: MarketCreation;
  status: MarketStatus;
  question: string;
  poolId: number | null;
  categories: { ticker: string; color: string }[];
  poolExists: boolean;
  bounds?: [number, number];
  pool?: {
    volume: number;
    assetIds: string[];
  };
};
