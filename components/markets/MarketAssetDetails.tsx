import { fromCompositeIndexerAssetId } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { DAY_SECONDS, ZTG } from "lib/constants";
import { useMarketsStore } from "lib/stores/MarketsStore";
import MarketStore from "lib/stores/MarketStore";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import { get24HrPriceChange } from "lib/util/market";
import { useMarket } from "lib/hooks/queries/useMarket";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { from } from "rxjs";
import FullSetButtons from "./FullSetButtons";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";

const columns: TableColumn[] = [
  {
    header: "Token",
    accessor: "token",
    type: "token",
  },
  { header: "Implied %", accessor: "pre", type: "percentage" },
  { header: "Total Value", accessor: "totalValue", type: "currency" },
  { header: "Outcome", accessor: "outcome", type: "text" },
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
  ({ marketStore }: { marketStore: MarketStore }) => {
    const [tableData, setTableData] = useState<TableData[]>();
    const { graphQlEnabled } = useUserStore();
    const store = useStore();
    const navigationStore = useNavigationStore();
    const marketsStore = useMarketsStore();
    const [poolAlreadyDeployed, setPoolAlreadyDeployed] = useState(false);
    const [authReportNumberOrId, setAuthReportNumberOrId] = useState<number>();

    const { data: market } = useMarket({ marketId: marketStore.id });
    const { data: spotPrices } = useMarketSpotPrices(marketStore.id);

    useEffect(() => {
      navigationStore.setPage("marketDetails");
      (async () => {
        setPoolAlreadyDeployed(marketStore?.poolExists);
      })();
    }, [marketsStore]);

    const marketLoaded = marketStore != null;

    useEffect(() => {
      if (marketLoaded && poolAlreadyDeployed) {
        getPageData();
      }
    }, [marketStore?.pool]);

    useEffect(() => {
      if (marketStore == null) {
        return;
      }
      getPageData();
    }, [marketStore, spotPrices]);

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
          setAuthReportNumberOrId(null);
        } else {
          const reportJSON: any = report.toJSON();
          if (reportJSON.scalar) {
            return reportJSON.scalar;
          } else {
            return reportJSON.categorical;
          }
        }
      };

      const sub = from(fetchAuthorizedReport(marketStore.id)).subscribe((res) =>
        setAuthReportNumberOrId(res),
      );
      return () => sub.unsubscribe();
    }, [store.sdk?.api, marketStore?.id, marketStore?.status]);

    const getPageData = async () => {
      let tblData: TableData[] = [];

      if (marketStore.poolExists && spotPrices) {
        const dateOneDayAgo = new Date(
          new Date().getTime() - DAY_SECONDS * 1000,
        ).toISOString();

        const totalAssetPrice = Array.from(spotPrices.values()).reduce(
          (val, cur) => val.plus(cur),
          new Decimal(0),
        );

        for (const [index, assetId] of Array.from(
          marketStore.outcomeAssetIds.entries(),
        )) {
          const ticker = marketStore.outcomesMetadata[index]["ticker"];
          const color =
            marketStore.outcomesMetadata[index]["color"] || "#ffffff";
          const outcomeName = marketStore.outcomesMetadata[index]["name"];
          const currentPrice = spotPrices.get(index).toNumber();

          let priceHistory: {
            newPrice: number;
            timestamp: string;
          }[];
          if (graphQlEnabled === true) {
            priceHistory = await store.sdk.models.getAssetPriceHistory(
              marketStore.id,
              //@ts-ignore
              assetId.categoricalOutcome?.[1] ?? assetId.scalarOutcome?.[1],
              dateOneDayAgo,
            );
          }

          const priceChange = priceHistory
            ? get24HrPriceChange(priceHistory)
            : 0;
          tblData = [
            ...tblData,
            {
              assetId,
              id: index,
              token: {
                color,
                label: ticker,
              },
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
                  : 0,
              change: priceChange,
              buttons: (
                <AssetActionButtons
                  marketId={marketStore?.market.marketId}
                  assetId={
                    fromCompositeIndexerAssetId(
                      JSON.stringify(assetId),
                    ).unwrap() as any
                  }
                  assetTicker={ticker}
                />
              ),
            },
          ];
        }
        setTableData(tblData);
      } else {
        tblData = marketStore.outcomesMetadata.map((outcome) => ({
          token: {
            color: outcome["color"] || "#ffffff",
            label: outcome["ticker"],
          },
          outcome: outcome["name"],
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

    const getWinningCategoricalOutcome = () => {
      const reportedOutcome = marketStore.resolvedCategoricalOutcome;

      const outcome = tableData?.find(
        (data) =>
          JSON.stringify(data.assetId) ===
          JSON.stringify(reportedOutcome.asset),
      );

      return outcome ? [outcome] : undefined;
    };

    return (
      <div>
        {marketStore?.is("Disputed") && authReportNumberOrId != null && (
          <>
            <div className="sub-header mt-ztg-40">Authorized Report</div>
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
            <div className="sub-header mt-ztg-40">Reported Outcome</div>
            {marketStore.type === "categorical" ? (
              <Table columns={columns} data={getReportedOutcome()} />
            ) : (
              <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
                {new Decimal(
                  //@ts-ignore
                  marketStore.lastDispute?.outcome.scalar ??
                    marketStore.reportedScalarOutcome,
                )
                  .div(ZTG)
                  .toString()}
              </div>
            )}
          </>
        )}
        {marketStore?.is("Disputed") && (
          <>
            <div className="sub-header mt-ztg-40">Disputed Outcome</div>
            {marketStore.type === "categorical" ? (
              <Table columns={columns} data={getReportedOutcome()} />
            ) : (
              <div className="font-mono font-bold text-ztg-18-150 mt-ztg-10">
                {new Decimal(
                  //@ts-ignore
                  marketStore.lastDispute?.outcome.scalar ??
                    marketStore.reportedScalarOutcome,
                )
                  .div(ZTG)
                  .toString()}
              </div>
            )}
          </>
        )}
        {marketStore?.is("Resolved") ? (
          <>
            <div className="sub-header mt-ztg-40">Winning Outcome</div>
            {marketStore.type === "categorical" ? (
              <Table
                columns={columns}
                data={getWinningCategoricalOutcome() as TableData[]}
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
        <div className="flex mt-ztg-40 items-center">
          <span className="sub-header">Outcomes</span>
          {marketStore && (
            <FullSetButtons marketId={marketStore.market.marketId} />
          )}
          {marketStore?.pool ? (
            <Link
              href={`/liquidity/${marketStore.pool.poolId}`}
              className="text-sky-600 bg-sky-200 dark:bg-black ml-auto uppercase font-bold text-ztg-12-120 rounded-ztg-5 px-ztg-20 py-ztg-5 "
            >
              Liquidity Pool
            </Link>
          ) : (
            <></>
          )}
        </div>
        <Table columns={columns} data={tableData} />
      </div>
    );
  },
);

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
