import { Dialog } from "@headlessui/react";
import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  CategoricalAssetId,
  ZTG,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import Avatar from "components/ui/Avatar";
import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Modal from "components/ui/Modal";
import Table, { TableColumn, TableData } from "components/ui/Table";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useVoteDraws";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { CourtStage } from "lib/state/court/get-stage";
import { shortenAddress } from "lib/util";
import { useMemo, useState } from "react";
import { BsShieldFillExclamation } from "react-icons/bs";

export type SelectedDrawsTableProps = {
  caseId: number;
  selectedDraws?: ZrmlCourtDraw[];
  market: FullMarketFragment;
  stage?: CourtStage;
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
  {
    header: "",
    accessor: "actions",
    type: "component",
  },
];

export const SelectedDrawsTable: React.FC<SelectedDrawsTableProps> = ({
  caseId,
  selectedDraws,
  market,
  stage,
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
                <div className="center gap-1">
                  {draw.vote.asRevealed.voteItem.isOutcome &&
                  draw.vote.asRevealed.voteItem.asOutcome.isCategorical
                    ? market.categories?.[
                        draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber()
                      ].ticker
                    : "Voted"}
                  <InfoPopover>
                    <div className="mb-2">
                      <label className="text-sm font-semibold">
                        Commitment Hash:
                      </label>
                      <div className="text-xs">
                        {draw.vote.asRevealed.commitment.toHex()}
                      </div>
                    </div>
                    <div className="">
                      <label className="text-sm font-semibold">Salt:</label>
                      <div className="text-xs">
                        {draw.vote.asRevealed.salt.toHex()}
                      </div>
                    </div>
                  </InfoPopover>
                </div>
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
        actions: (
          <>
            {stage?.type === "vote" && draw.vote.isSecret && (
              <DenounceVoteButton caseId={caseId} draw={draw} market={market} />
            )}
          </>
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

type DenounceVoteButtonProps = {
  caseId: number;
  draw: ZrmlCourtDraw;
  market: FullMarketFragment;
};

const DenounceVoteButton: React.FC<DenounceVoteButtonProps> = ({
  caseId,
  draw,
  market,
}) => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedVoteOutcome, setSelectedVoteOutcome] = useState(
    outcomeAssets[0],
  );

  const [salt, setSalt] = useState("");

  const { send, isBroadcasting, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.court.denounceVote(
          caseId,
          draw.courtParticipant.toString(),
          { Outcome: selectedVoteOutcome[1] },
          salt,
        );
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, voteDrawsRootKey, caseId]);
      },
    },
  );

  const onClose = () => {
    setOpen(false);
    setSelectedVoteOutcome(outcomeAssets[0]);
    setSalt("");
  };

  return (
    <>
      <button
        className="center gap-2 rounded-md border-2 border-orange-400 px-2 py-1 text-sm text-orange-400"
        onClick={() => setOpen(true)}
      >
        <BsShieldFillExclamation size={12} />
        denounce
      </button>
      <Modal open={open} onClose={onClose}>
        <Dialog.Panel className="relative max-w-[640px] rounded-ztg-10 bg-white p-[15px]">
          <h3 className="mb-2">Denounce Vote</h3>
          <p className="mb-4 text-sm text-gray-500">
            Denouncing a vote should be done if a vote has been revealed during
            the voting phase. To denounce you have to know the <b>outcome</b>{" "}
            the juror voted for and the <b>salt</b> that was used when voting.
          </p>
          <div className="mb-2 flex items-center">
            <label className="flex-1 text-gray-500">Voted Outcome:</label>
            <div className="inline-block pr-5 !text-sm">
              <MarketContextActionOutcomeSelector
                market={market}
                selected={selectedVoteOutcome}
                options={outcomeAssets}
                onChange={(assetId) => {
                  setSelectedVoteOutcome(assetId as CategoricalAssetId);
                }}
              />
            </div>
          </div>
          <div className="mb-6 flex items-center">
            <label className="flex-1 text-gray-500">Salt:</label>
            <Input
              type="text"
              value={salt}
              onChange={(e) => {
                setSalt(e.target.value);
              }}
              className="w-2/3 text-sm"
              placeholder="0x....."
            />
          </div>
          <TransactionButton
            disabled={isLoading || isBroadcasting}
            loading={isBroadcasting}
            onClick={() => send()}
            className="!bg-orange-400"
          >
            Denounce Vote
          </TransactionButton>
        </Dialog.Panel>
      </Modal>
    </>
  );
};
