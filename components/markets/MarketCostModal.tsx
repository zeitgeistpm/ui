import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { observer } from "mobx-react";

const CostRow = ({
  title,
  description,
  cost,
}: {
  title: string;
  description?: string;
  cost: string;
}) => {
  return (
    <div className="flex text-ztg-12-150">
      <div className="">
        <div>{title}</div>
        {description && <div className="text-sky-600">{description}</div>}
      </div>
      <div className="flex flex-col items-center justify-center ml-auto">
        <div className="font-bold font-mono">{cost}</div>
      </div>
    </div>
  );
};

const MarketCostModal = ({ networkFee, permissionless, liquidity }) => {
  const { data: constants } = useChainConstants();
  const tokenSymbol = constants?.tokenSymbol;

  return (
    <div className="flex flex-col gap-y-5 p-[15px]">
      {networkFee && (
        <CostRow title="Network Fee" cost={`${networkFee} ${tokenSymbol}`} />
      )}

      {permissionless === true ? (
        <CostRow
          title="Permissionless Bond"
          description="Returned if the market isn't deleted by the committee"
          cost={`${constants?.markets.validityBond} ${tokenSymbol}`}
        />
      ) : (
        <CostRow
          title="Advised Bond"
          description="Returned if the market is approved or ends before being approved by the committee"
          cost={`${constants?.markets.advisoryBond} ${tokenSymbol}`}
        />
      )}
      <CostRow
        title="Oracle Bond"
        description="Returned if oracle reports the market outcome on time"
        cost={`${constants?.markets.oracleBond} ${tokenSymbol}`}
      />
      <CostRow
        title="Liquidity"
        description="Can be withdrawn at any time, will collect fees but subject to impermanent loss"
        cost={`${liquidity} ${tokenSymbol}`}
      />
    </div>
  );
};

export default MarketCostModal;
