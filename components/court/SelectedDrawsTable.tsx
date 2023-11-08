import Avatar from "components/ui/Avatar";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useSelectedDraws } from "lib/hooks/queries/court/useSelectedDraws";
import { shortenAddress } from "lib/util";
import { useMemo } from "react";
import InfoPopover from "components/ui/InfoPopover";
import Decimal from "decimal.js";
import { ZTG } from "@zeitgeistpm/sdk";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

export type SelectedDrawsTableProps = {
  selectedDraws?: ZrmlCourtDraw[];
  market: FullMarketFragment;
};

const columns: TableColumn[] = [
  {
    header: "Juror",
    accessor: "juror",
    type: "component",
  },
  {
    header: "Status",
    accessor: "status",
    type: "component",
  },
  {
    header: "Voted Outcome",
    accessor: "vote",
    type: "component",
  },
];

export const SelectedDrawsTable: React.FC<SelectedDrawsTableProps> = ({
  selectedDraws,
  market,
}) => {
  const { data: constants } = useChainConstants();

  const data: TableData[] | undefined = useMemo(() => {
    return selectedDraws?.map((draw) => {
      const status = draw.vote.type;
      return {
        juror: (
          <div className="flex items-center gap-3">
            <Avatar address={draw.courtParticipant.toString()} size={18} />
            <div className="text-sm">
              {shortenAddress(draw.courtParticipant.toString())}
            </div>
          </div>
        ),
        status: <div>{status}</div>,
        vote: (
          <div
            className={`
            flex items-center gap-2
          `}
          >
            <span className="">
              {draw.vote.isDrawn ? (
                <span className="text-blue-400">Waiting for vote</span>
              ) : draw.vote.isSecret ? (
                <span>
                  <span>[</span>
                  <span className="text-gray-300">∗∗∗∗∗∗</span>
                  <span>]</span>
                </span>
              ) : draw.vote.isDelegated ? (
                <span className="text-gray-400">Delegated Vote</span>
              ) : draw.vote.isRevealed ? (
                "Voted"
              ) : draw.vote.isDenounced ? (
                <span className="text-red-400">Denounced</span>
              ) : (
                "Unknown"
              )}
            </span>

            {draw.vote.isDelegated && (
              <InfoPopover position="top">
                <div>
                  <div className="flex mb-2">
                    <div className="flex-1 font-semibold">Delegated</div>
                    <div className="flex-1 font-semibold">Stake</div>
                  </div>
                  {draw.vote.asDelegated.delegatedStakes
                    .toArray()
                    .map(([account, stake]) => (
                      <div className="flex items-center gap-1 mb-1">
                        <div className="flex-1 flex items-center gap-1">
                          <Avatar address={account.toString()} size={18} />
                          {shortenAddress(account.toString())}
                        </div>
                        <div className="flex-1">
                          {new Decimal(stake.toString()).div(ZTG).toFixed(1)}
                          <span className="ml-1 font-semibold">
                            {constants?.tokenSymbol}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </InfoPopover>
            )}

            {draw.vote.isSecret && (
              <InfoPopover position="top">
                <div className="mb-3">
                  Secret vote. Will be revealed by the juror when the court
                  reaches aggregation phase.
                </div>
                <h3 className="mb-1 text-sm">Commitment Hash:</h3>
                <div className="text-xxs">
                  {draw.vote.asSecret.commitment.toHex()}
                </div>
              </InfoPopover>
            )}
          </div>
        ),
      };
    });
  }, [selectedDraws]);

  return (
    <div>
      <Table columns={columns} data={data} />
    </div>
  );
};
