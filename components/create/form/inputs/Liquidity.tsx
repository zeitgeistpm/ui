import PoolSettings, {
  PoolAssetRowData,
} from "components/liquidity/PoolSettings";
import Toggle from "components/ui/Toggle";
import Decimal from "decimal.js";
import { CurrencyTag, Liquidity } from "lib/state/market-creation/types/form";
import { ReactNode } from "react";
import { AiOutlineWarning } from "react-icons/ai";
import { FormEvent } from "../types";

export type LiquidityInputProps = {
  name: string;
  value: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  onBlur: (event: FormEvent<Liquidity>) => void;
  errorMessage?: string | ReactNode;
  currency: CurrencyTag;
};

export const LiquidityInput = ({
  name,
  value,
  onChange,
  onBlur,
  errorMessage,
  currency,
}: LiquidityInputProps) => {
  const handleRowsChange = (data: PoolAssetRowData[]) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value,
          rows: transformRows(data),
        },
      },
    });
  };

  const handleDeploymentToggle = (checked: boolean) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value,
          deploy: checked,
        },
      },
    });
  };

  return (
    <div className="center">
      <div className="md:max-w-4xl">
        <div className="mb-10 flex justify-center">
          <div className="flex flex-col justify-center items-center">
            <div className="font-light text-sm mb-2">Deploy Pool?</div>
            <Toggle
              checked={value?.deploy}
              activeClassName={
                currency === "ZTG" ? "bg-ztg-blue" : "bg-polkadot"
              }
              onChange={handleDeploymentToggle}
            />
          </div>
        </div>

        <div>
          {!value?.deploy ? (
            <div>
              <div className="mb-4 center text-gray-500">
                <AiOutlineWarning size={32} />
              </div>
              <p className="center text-center md:max-w-lg text-gray-400">
                No liquidity pool will be deployed for the market. You can
                deploy a pool after you create the market from the market page.
              </p>
            </div>
          ) : errorMessage ? (
            <div>{errorMessage}</div>
          ) : (
            <PoolSettings
              data={transformRows(value?.rows ?? [])}
              onChange={handleRowsChange}
              noDataMessage={errorMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};

function transformRows(rows: PoolAssetRowData[]): Liquidity["rows"];
function transformRows(rows: Liquidity["rows"]): PoolAssetRowData[];
function transformRows(
  rows: PoolAssetRowData[] | Liquidity["rows"],
): PoolAssetRowData[] | Liquidity["rows"] {
  return rows?.map((row) => ({
    ...row,
    price: {
      price: Decimal.isDecimal(row.price.price)
        ? row.price.price.toString()
        : new Decimal(row.price.price),
      locked: row.price.locked,
    },
  }));
}
