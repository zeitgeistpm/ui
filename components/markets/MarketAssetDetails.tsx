import { parseAssetId, isRpcSdk } from "@zeitgeistpm/sdk-next";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
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
    width: "120px",
  },
];

const MarketAssetDetails = ({ marketId }: { marketId: number }) => {
  const [tableData, setTableData] = useState<TableData[]>();
  const [sdk] = useSdkv2();

  const [authReportNumberOrId, setAuthReportNumberOrId] = useState<number>();

  const { data: market } = useMarket({ marketId });
  const baseAsset = parseAssetId(market?.baseAsset).unrightOr(null);
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
        const outcomeName = category.name;
        const currentPrice = spotPrices?.get(index).toNumber();

        const priceChange = priceChanges?.get(index);
        tblData = [
          ...tblData,
          {
            assetId: market.pool.weights[index].assetId,
            id: index,
            outcome: outcomeName,
            totalValue: {
              value: currentPrice,
              usdValue: usdPrice?.mul(currentPrice).toNumber(),
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
                  parseAssetId(
                    market.pool.weights[index].assetId,
                  ).unwrap() as any
                }
              />
            ),
          },
        ];
      }
      setTableData(tblData);
    } else {
      tblData = market.categories.map((category) => ({
        outcome: category.name,
      }));
      setTableData(tblData);
    }
  };

  // TODO: remove once market history is implemented. may neeed this for reference
  const getReportedCategoricalOutcome = () => {
    if (!rpcMarket) return;
    const outcomeIndex = rpcMarket.report
      .unwrap()
      .outcome.asCategorical.toNumber();

    const outcome = tableData?.find((data) => data.id === outcomeIndex);

    return outcome ? [outcome] : undefined;
  };

  const getDisputedCategoricalOutcome = () => {
    const lastDisputeIndex =
      disputes?.[disputes.length - 1].outcome.asCategorical.toNumber();
    const outcome = tableData?.find((data) => data.id === lastDisputeIndex);
    return outcome ? [outcome] : undefined;
  };

  const getReportedScalarOutcome = () => {
    if (!rpcMarket) return;

    const lastDispute = disputes?.[disputes.length - 1];

    const reportVal = new Decimal(
      lastDispute?.outcome.asScalar.toString() ??
        rpcMarket.report?.unwrap().outcome.asScalar.toString(),
    )
      .div(ZTG)
      .toString();
    if (market.scalarType === "date") {
      return moment(Number(reportVal)).format("YYYY-MM-DD HH:mm");
    } else {
      return reportVal;
    }
  };

  const getWinningCategoricalOutcome = () => {
    const resolvedOutcomeIndex = rpcMarket?.resolvedOutcome
      .unwrap()
      .asCategorical.toNumber();

    const outcome = tableData?.find((data) => data.id === resolvedOutcomeIndex);

    return outcome ? [outcome] : undefined;
  };

  return <Table columns={columns} data={tableData} />;
};

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
