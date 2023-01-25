import { ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { formatNumberLocalized } from "lib/util";

export type MarketPositionsProps = {
  title: string;
  usdZtgPrice: Decimal;
  positions: MarketPosition[];
};

export type MarketPosition = {
  outcome: string;
  balance: Decimal;
  price: Decimal;
  dailyChangePercentage: number;
};

export const MarketPositions = ({
  title,
  positions,
  usdZtgPrice,
}: MarketPositionsProps) => {
  return (
    <div>
      <h2 className="text-xl text-center font-light mb-6">{title}</h2>
      <table className="table-auto w-full">
        <thead className="border-b-1 border-gray-300">
          <tr className="text-gray-400">
            <th className="pb-2 font-normal text-left">Outcome</th>
            <th className="pb-2 font-normal text-right">Balance</th>
            <th className="pb-2 font-normal text-right">Price Per Share</th>
            <th className="pb-2 font-normal text-right">Total Value</th>
            <th className="pb-2 font-normal text-right">24 Hrs</th>
            <th className="pb-2 font-normal text-right">Trade</th>
          </tr>
        </thead>
        <tbody>
          {positions.map(
            ({ outcome, balance, price, dailyChangePercentage }) => (
              <tr className="text-lg border-b-1 border-gray-300">
                <td className="py-6 pl-0 text-left">
                  <span className="font-bold">{outcome}</span>
                </td>
                <td className="py-6 text-right pl-0">
                  <span className="text-blue-500">
                    {formatNumberLocalized(balance.div(ZTG).toNumber())}
                  </span>
                </td>
                <td className="py-6 text-right pl-0">
                  <div className="font-bold mb-2">
                    {formatNumberLocalized(price.toNumber())}
                  </div>
                  <div className="text-gray-400 font-light">
                    ≈ $
                    {formatNumberLocalized(usdZtgPrice.mul(price).toNumber())}
                  </div>
                </td>
                <td className="py-6 text-right pl-0">
                  <div className="font-bold mb-2">
                    {formatNumberLocalized(
                      balance.mul(price).div(ZTG).toNumber(),
                    )}
                  </div>
                  <div className="text-gray-400 font-light">
                    ≈ $
                    {formatNumberLocalized(
                      usdZtgPrice.mul(balance.mul(price).div(ZTG)).toNumber(),
                    )}
                  </div>
                </td>
                <td className="py-6 text-right pl-0">
                  <div
                    className={`font-bold ${
                      dailyChangePercentage > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {dailyChangePercentage > 0 ? "+" : ""}
                    {dailyChangePercentage}%
                  </div>
                </td>
                <td className="py-6 text-right pl-0">
                  <button className="border-gray-300 border-2 py-3 px-5 rounded-md">
                    Trade
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};
