import { useQuery } from "@tanstack/react-query";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";

export const key = () => ["ztg-price-info"];

export const useZtgInfo = () => {
  return useQuery(key(), () => fetchZTGInfo(), {
    refetchInterval: 1000 * 10,
  });
};
