import { parseAssetId } from "@zeitgeistpm/sdk-next";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { useRpcMarket } from "lib/hooks/queries/useRpcMarket";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import moment from "moment";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { from } from "rxjs";

const columns: TableColumn[] = [
  { header: "Outcome", accessor: "outcome", type: "text" },
  { header: "Implied %", accessor: "pre", type: "percentage" },
  { header: "Price", accessor: "totalValue", type: "currency" },
  {
    header: "24Hr Change",
    accessor: "change",
    type: "change",
    width: "120px",
  },
  {
    header: "",
    accessor: "buttons",
    type: "component",
    width: "140px",
  },
];

const MarketAssetDetails = observer(({ marketId }: { marketId: number }) => {
  const [tableData, setTableData] = useState<TableData[]>();
  const store = useStore();

  const [authReportNumberOrId, setAuthReportNumberOrId] = useState<number>();

  const { data: market } = useMarket({ marketId });

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
      store.sdk?.api == null ||
      marketId == null ||
      market?.status === "Active" ||
      market?.status === "Proposed"
    ) {
      return;
    }
    const fetchAuthorizedReport = async (marketId: number) => {
      const report =
        await store.sdk.api.query.authorized.authorizedOutcomeReports(marketId);

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
  }, [store.sdk?.api, marketId, market?.status]);

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
              usdValue: 0,
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

  const getDisputedScalarOutcome = () => {
    const lastDispute = disputes?.[disputes.length - 1];
    const reportVal = new Decimal(
      lastDispute?.outcome.asScalar.toString() ?? market.report?.outcome.scalar,
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
    const resolvedOutcomeIndex = rpcMarket.resolvedOutcome
      .unwrap()
      .asCategorical.toNumber();

    const outcome = tableData?.find(
      (data) => data.assetId === resolvedOutcomeIndex,
    );

    return outcome ? [outcome] : undefined;
  };

  return (
    <div>
      {market?.status === "Disputed" && authReportNumberOrId != null && (
        <>
          <h4 className="mt-10">Authorized Report</h4>
          {market.marketType.categorical ? (
            <Table
              columns={columns}
              data={
                tableData?.find((data) => data.id === authReportNumberOrId)
                  ? [
                      tableData?.find(
                        (data) => data.id === authReportNumberOrId,
                      ),
                    ]
                  : []
              }
              loadingNumber={1}
            />
          ) : (
            <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
              {authReportNumberOrId}
            </div>
          )}
        </>
      )}
      {market?.status === "Reported" && (
        <>
          <h4 className="mt-10">Reported Outcome</h4>
          {market.marketType.categorical ? (
            <Table
              columns={columns}
              data={getReportedCategoricalOutcome()}
              loadingNumber={1}
            />
          ) : (
            <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10 mb-[10px]">
              {getReportedScalarOutcome()}
            </div>
          )}
        </>
      )}
      {market?.status === "Disputed" && (
        <>
          <h4 className="mt-10">Disputed Outcome</h4>
          {market.marketType.categorical ? (
            <Table
              columns={columns}
              data={getDisputedCategoricalOutcome()}
              loadingNumber={1}
            />
          ) : (
            <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10 mb-[10px]">
              {getReportedScalarOutcome()}
            </div>
          )}
        </>
      )}
      {market?.status === "Resolved" ? (
        <>
          <h4 className="mt-10">Winning Outcome</h4>
          {market.marketType.categorical ? (
            <Table
              columns={columns}
              data={getWinningCategoricalOutcome() as TableData[]}
              loadingNumber={1}
            />
          ) : (
            market && (
              <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
                {new Decimal(market.resolvedOutcome).div(ZTG).toNumber()}
              </div>
            )
          )}
        </>
      ) : (
        <></>
      )}
      <Table columns={columns} data={tableData} />
    </div>
  );
});

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
