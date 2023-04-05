import { parseAssetId } from "@zeitgeistpm/sdk-next";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import MarketStore from "lib/stores/MarketStore";
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

const MarketAssetDetails = observer(
  ({
    marketId,
    marketStore,
  }: {
    marketId: number;
    marketStore: MarketStore;
  }) => {
    const [tableData, setTableData] = useState<TableData[]>();
    const store = useStore();

    const [authReportNumberOrId, setAuthReportNumberOrId] = useState<number>();

    const { data: market } = useMarket({ marketId });
    const { data: spotPrices } = useMarketSpotPrices(marketId);
    const { data: priceChanges } = useMarket24hrPriceChanges(marketId);

    const { data: disputes } = useMarketDisputes(marketId);

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
        marketStore?.id == null ||
        marketStore?.status === "Active" ||
        marketStore?.status === "Proposed"
      ) {
        return;
      }
      const fetchAuthorizedReport = async (marketId: number) => {
        const report =
          await store.sdk.api.query.authorized.authorizedOutcomeReports(
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

      const sub = from(fetchAuthorizedReport(marketStore.id)).subscribe(
        (res) => {
          setAuthReportNumberOrId(res);
        },
      );
      return () => sub.unsubscribe();
    }, [store.sdk?.api, marketStore?.id, marketStore?.status]);

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
                  ? Math.round(
                      (currentPrice / totalAssetPrice.toNumber()) * 100,
                    )
                  : null,
              change: priceChange,
              poolId: market.pool.poolId,
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

    const getReportedOutcome = () => {
      let outcomeId: number;
      if (marketStore.is("Disputed") && marketStore.lastDispute) {
        // @ts-ignore
        outcomeId = marketStore.lastDispute.outcome.categorical;
      } else {
        outcomeId = marketStore.reportedOutcomeIndex;
      }
      const outcome = tableData?.find((data) => data.id === outcomeId);

      return outcome ? [outcome] : undefined;
    };

    const getReportedScalarOutcome = () => {
      const lastDispute = disputes?.[disputes.length - 1];
      const reportVal = new Decimal(
        lastDispute?.outcome.asScalar.toString() ??
          market.report?.outcome.scalar,
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
      const reportedOutcome = marketStore.resolvedCategoricalOutcome;

      const outcome = tableData?.find(
        (data) => data.assetId === JSON.stringify(reportedOutcome?.asset),
      );

      return outcome ? [outcome] : undefined;
    };

    return (
      <div>
        {marketStore?.is("Disputed") && authReportNumberOrId != null && (
          <>
            <h4 className="mt-10">Authorized Report</h4>
            {marketStore.type === "categorical" ? (
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
        {marketStore?.is("Reported") && (
          <>
            <h4 className="mt-10">Reported Outcome</h4>
            {marketStore.type === "categorical" ? (
              <Table
                columns={columns}
                data={getReportedOutcome()}
                loadingNumber={1}
              />
            ) : (
              <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10 mb-[10px]">
                {getReportedScalarOutcome()}
              </div>
            )}
          </>
        )}
        {marketStore?.is("Disputed") && (
          <>
            <h4 className="mt-10">Disputed Outcome</h4>
            {marketStore.type === "categorical" ? (
              <Table
                columns={columns}
                data={getReportedOutcome()}
                loadingNumber={1}
              />
            ) : (
              <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10 mb-[10px]">
                {getReportedScalarOutcome()}
              </div>
            )}
          </>
        )}
        {marketStore?.is("Resolved") ? (
          <>
            <h4 className="mt-10">Winning Outcome</h4>
            {marketStore.type === "categorical" ? (
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
  },
);

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
