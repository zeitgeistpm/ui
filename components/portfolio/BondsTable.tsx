import Table, { TableColumn } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountBonds } from "lib/hooks/queries/useAccountBonds";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import EmptyPortfolio from "./EmptyPortfolio";
import MarketPositionHeader from "./MarketPositionHeader";

const columns: TableColumn[] = [
  {
    header: "Bond type",
    accessor: "type",
    type: "paragraph",
  },
  {
    header: "Responsible",
    accessor: "responsible",
    type: "address",
  },
  {
    header: "Value",
    accessor: "value",
    type: "currency",
  },
  {
    header: "Settled",
    accessor: "settled",
    type: "text",
  },
];

const BondsTable = ({ address }: { address: string }) => {
  const { data: marketBonds, isLoading } = useAccountBonds(address);
  const { data: ztgPrice } = useZtgPrice();

  return (
    <div>
      {isLoading === false &&
      (marketBonds == null || marketBonds?.length === 0) ? (
        <EmptyPortfolio
          headerText="No market bonds"
          bodyText="You will aquire bonds when creating a market"
          buttonText="Create Market"
          buttonLink="/create"
        />
      ) : (
        <>
          {marketBonds?.map((market) => (
            <div key={market.marketId} className="mb-[30px]">
              <MarketPositionHeader
                marketId={market.marketId}
                question={market.question}
                baseAsset={market.baseAsset}
              />
              <div className="rounded-lg bg-gradient-to-br from-sky-50/30 to-blue-50/30 p-4 shadow-lg">
                <div className="overflow-hidden rounded-lg bg-white/60 backdrop-blur-sm">
                  <Table
                    columns={columns}
                    data={[
                      {
                        type: "Creation",
                        responsible: market.bonds.creation.who,
                        value: {
                          value: new Decimal(market.bonds.creation.value)
                            .div(ZTG)
                            .toNumber(),
                          usdValue: new Decimal(market.bonds.creation.value)
                            .div(ZTG)
                            .mul(ztgPrice ?? 0)
                            .toNumber(),
                        },
                        settled:
                          market.bonds.creation.isSettled === true
                            ? "Yes"
                            : "No",
                      },
                      {
                        type: "Oracle",
                        responsible: market.bonds.oracle.who,
                        value: {
                          value: new Decimal(market.bonds.oracle.value)
                            .div(ZTG)
                            .toNumber(),
                          usdValue: new Decimal(market.bonds.oracle.value)
                            .div(ZTG)
                            .mul(ztgPrice ?? 0)
                            .toNumber(),
                        },
                        settled:
                          market.bonds.oracle.isSettled === true ? "Yes" : "No",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default BondsTable;
