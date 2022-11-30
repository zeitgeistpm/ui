import { createContext, useContext } from "react";

const MarketCardContext = createContext<{ baseAsset: string }>(null);

export const useMarketCardContext = () => {
  const context = useContext(MarketCardContext);
  return context;
};

export default MarketCardContext;
