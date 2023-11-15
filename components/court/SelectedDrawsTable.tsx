import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ZTG } from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import InfoPopover from "components/ui/InfoPopover";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { shortenAddress } from "lib/util";
import { useMemo } from "react";

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
                draw.vote.asRevealed.voteItem.isOutcome &&
                draw.vote.asRevealed.voteItem.asOutcome.isCategorical ? (
                  market.categories?.[
                    draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber()
                  ].ticker
                ) : (
                  "Voted"
                )
              ) : draw.vote.isDenounced ? (
                <span className="text-red-400">Denounced</span>
              ) : (
                "Unknown"
              )}
            </span>

            {draw.vote.isDelegated && (
              <InfoPopover position="top">
                <div>
                  <div className="mb-2 flex">
                    <div className="flex-1 font-semibold">Delegated</div>
                    <div className="flex-1 font-semibold">Stake</div>
                  </div>
                  {draw.vote.asDelegated.delegatedStakes
                    .toArray()
                    .map(([account, stake]) => (
                      <div
                        key={account.toString()}
                        className="mb-1 flex items-center gap-1"
                      >
                        <div className="flex flex-1 items-center gap-1">
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
