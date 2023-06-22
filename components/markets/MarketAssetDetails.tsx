import {
  isRpcSdk,
  CategoricalAssetId,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useRpcMarket } from "lib/hooks/queries/useRpcMarket";

import moment from "moment";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { from } from "rxjs";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { parseAssetIdString } from "lib/util/parse-asset-id";

const columns: TableColumn[] = [
  { header: "Outcome", accessor: "outcome", type: "text" },
  {
    header: "Implied %",
    accessor: "pre",
    type: "percentage",
    collapseOrder: 1,
  },
  { header: "Price", accessor: "totalValue", type: "currency" },
  {
    header: "24Hr Change",
    accessor: "change",
    type: "change",
    width: "120px",
    collapseOrder: 2,
  },
  {
    header: "",
    accessor: "buttons",
    type: "component",
    width: "180px",
  },
];

const MarketAssetDetails = ({ marketId }: { marketId: number }) => {
  const [tableData, setTableData] = useState<TableData[]>();
  const [sdk] = useSdkv2();

  const [authReportNumberOrId, setAuthReportNumberOrId] = useState<number>();

  const { data: market } = useMarket({ marketId });
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: usdPrice } = useAssetUsdPrice(baseAsset);

  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: priceChanges } = useMarket24hrPriceChanges(marketId);

  const { data: disputes } = useMarketDisputes(marketId);
  const { data: rpcMarket } = useRpcMarket(marketId);
  const poolAlreadyDeployed = market?.pool?.poolId != null;

  useEffect(() => {
    if (market == null) {
      return;
    }
    getPageData();
  }, [market, spotPrices, priceChanges]);

  useEffect(() => {
    if (
      !isRpcSdk(sdk) ||
      marketId == null ||
      market?.status === "Active" ||
      market?.status === "Proposed"
    ) {
      return;
    }
    const fetchAuthorizedReport = async (marketId: number) => {
      const report = await sdk.api.query.authorized.authorizedOutcomeReports(
        marketId,
      );

      if (report.isEmpty === true) {
        return null;
      } else {
        const reportJSON: any = report.toJSON();
        if (reportJSON.outcome.scalar) {
          return reportJSON.outcome.scalar;
        } else {
          return reportJSON.outcome.categorical;
        }
      }
    };

    const sub = from(fetchAuthorizedReport(marketId)).subscribe((res) => {
      setAuthReportNumberOrId(res);
    });
    return () => sub.unsubscribe();
  }, [sdk, marketId, market?.status]);

  const getPageData = async () => {
    let tblData: TableData[] = [];

    if (market && poolAlreadyDeployed) {
      const totalAssetPrice = spotPrices
        ? Array.from(spotPrices.values()).reduce(
            (val, cur) => val.plus(cur),
            new Decimal(0),
          )
        : new Decimal(0);

      for (const [index, category] of market.categories.entries()) {
        const outcomeName = category?.name;
        const currentPrice = spotPrices?.get(index)?.toNumber();

        const priceChange = priceChanges?.get(index);
        tblData = [
          ...tblData,
          {
            assetId: market.pool?.weights[index]?.assetId,
            id: index,
            outcome: outcomeName,
            totalValue: {
              value: currentPrice,
              usdValue: new Decimal(
                currentPrice ? usdPrice?.mul(currentPrice) : 0,
              ).toNumber(),
            },
            pre:
              currentPrice != null
                ? Math.round((currentPrice / totalAssetPrice.toNumber()) * 100)
                : null,
            change: priceChange,
            buttons: (
              <AssetActionButtons
                marketId={marketId}
                assetId={
                  parseAssetIdString(market.pool?.weights[index]?.assetId) as
                    | ScalarAssetId
                    | CategoricalAssetId
                }
              />
            ),
          },
        ];
      }
      setTableData(tblData);
    } else {
      tblData =
        market?.categories?.map((category) => ({
          outcome: category?.name,
        })) ?? [];
      setTableData(tblData);
    }
  };

  return <Table columns={columns} data={tableData} />;
};

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
