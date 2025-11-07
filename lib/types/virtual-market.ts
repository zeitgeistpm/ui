import { IndexerContext, Market } from "@zeitgeistpm/sdk";

/**
 * Extended Market type for virtual/combo markets created by useVirtualMarket.
 * The neoPool object has runtime properties added that aren't in the GraphQL schema.
 */
export type VirtualMarket = Market<IndexerContext> & {
  neoPool?: {
    isParentScalar?: boolean;
    isChildScalar?: boolean;
    [key: string]: any;
  };
};
