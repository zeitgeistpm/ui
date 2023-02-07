import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchZTGInfo, ZTGPriceInfo } from "@zeitgeistpm/utility/dist/ztg";
import Decimal from "decimal.js";
import { isEmpty } from "lodash";

export const key = () => ["ztg-price-info"];

export const useZtgInfo = (): UseQueryResult<ZTGPriceInfo> => {
  return useQuery(
    key(),
    async () => {
      try {
        const ztgInfo = await fetchZTGInfo();
        window.localStorage.setItem("ztgInfo", JSON.stringify(ztgInfo));
        return ztgInfo;
      } catch (err) {
        const ztgInfo = JSON.parse(
          window.localStorage.getItem("ztgInfo") || "{}",
        );
        if (isEmpty(ztgInfo)) {
          return { price: new Decimal(0), change: new Decimal(0) };
        } else {
          return ztgInfo;
        }
      }
    },
    {
      refetchInterval: 1000 * 60,
      keepPreviousData: true,
    },
  );
};
