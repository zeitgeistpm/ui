import { Dialog } from "@headlessui/react";
import { ZrmlCourtDraw } from "@polkadot/types/lookup";
import { u8aToHex } from "@polkadot/util";
import { blake2AsU8a } from "@polkadot/util-crypto";
import { useQueryClient } from "@tanstack/react-query";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import {
  CategoricalAssetId,
  MarketId,
  ZTG,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import { UserIdentity } from "components/markets/MarketHeader";
import Avatar from "components/ui/Avatar";
import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Modal from "components/ui/Modal";
import Table, { TableColumn, TableData } from "components/ui/Table";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { voteDrawsRootKey } from "lib/hooks/queries/court/useCourtVoteDraws";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { CourtStage } from "lib/state/court/get-stage";
import { CourtSalt } from "lib/state/court/useCourtSalt";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { useEffect, useMemo, useState } from "react";
import { BsShieldFillExclamation } from "react-icons/bs";
import { create } from "ts-opaque";
import { findAsset } from "lib/util/assets";

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
    header: "Vote",
    accessor: "vote",
    type: "component",
  },
  {
    header: "Weight",
    accessor: "weight",
    type: "number",
    hideMobile: true,
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
  const wallet = useWallet();
  const { data: constants } = useChainConstants();

  const data: TableData[] | undefined = useMemo(() => {
    return selectedDraws?.map((draw) => {
      return {
        juror: (
          <div className="flex items-center gap-3">
            <UserIdentity
              user={draw.courtParticipant.toString()}
              shorten={{ start: 4, end: 4 }}
            />
          </div>
        ),

        vote: (
          <div
            className={`
            flex items-center gap-2
          `}
          >
            <span className="">
              {draw.vote.isDrawn ? (
                stage?.type === "pre-vote" ? (
                  <span className="text-yellow-400">
                    Waiting for voting to start
                  </span>
                ) : stage?.type === "closed" ||
                  stage?.type === "appeal" ||
                  stage?.type === "reassigned" ||
                  stage?.type === "aggregation" ? (
                  <span className="text-orange-500">Failed to vote</span>
                ) : stage?.type === "vote" ? (
                  <span className="text-blue-400">Waiting for vote</span>
                ) : (
                  ""
                )
              ) : draw.vote.isSecret ? (
                <span>
                  <span>[</span>
                  <span className="hidden text-gray-300 md:inline">∗∗∗∗∗∗</span>
                  <span className="inline text-gray-300 md:hidden">*</span>
                  <span>]</span>
                </span>
              ) : draw.vote.isDelegated ? (
                <span className="text-gray-400">Delegated Vote</span>
              ) : draw.vote.isRevealed ? (
                <div className="center gap-1">
                  {draw.vote.asRevealed.voteItem.isOutcome &&
                  draw.vote.asRevealed.voteItem.asOutcome.isCategorical
                    ? findAsset(
                        {
                          CategoricalOutcome: [
                            market.marketId as MarketId,
                            draw.vote.asRevealed.voteItem.asOutcome.asCategorical.toNumber(),
                          ],
                        },
                        market.assets,
                      )?.ticker
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
                <div className="center gap-1">
                  <span className="text-red-400">Denounced</span>
                  <InfoPopover>
                    This vote was denounced and wont be counted. This means that
                    someone was able to get the secret salt used when voting and
                    denounce it.
                  </InfoPopover>
                </div>
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
        weight: draw.weight.toNumber(),

        actions: (
          <>
            {stage?.type === "vote" &&
              draw.vote.isSecret &&
              wallet.realAddress !== draw.courtParticipant.toString() && (
                <DenounceVoteButton
                  caseId={caseId}
                  draw={draw}
                  market={market}
                />
              )}
          </>
        ),
      };
    });
  }, [selectedDraws, wallet.realAddress]);

  return (
    <div className="!break-words text-sm md:text-base">
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

  const outcomeAssets = market.assets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedVoteOutcome, setSelectedVoteOutcome] = useState(
    outcomeAssets[0],
  );

  const [secretInput, setSecretInput] = useState("");
  const [showError, setShowError] = useState(false);

  const parsedSalt = useMemo<
    { error: string } | { salt: string } | null
  >(() => {
    const input = secretInput.trim();

    if (!isRpcSdk(sdk)) return null;

    if (input.length === 0)
      return {
        error: "Input is empty",
      };

    if (input.startsWith("0x")) {
      try {
        const salt = sdk.api.createType("H256", input).toHex();
        return {
          salt,
        };
      } catch (error) {
        return {
          error: "Invalid hex input",
        };
      }
    }

    if (input.split(" ").length !== 12) {
      return {
        error: "Invalid secret phrase, should be 12 words long.",
      };
    }

    const salt = create<CourtSalt>(blake2AsU8a(input));

    return {
      valid: true,
      salt: u8aToHex(salt),
    };
  }, [secretInput, sdk]);

  const { send, isBroadcasting, isLoading, isReady } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && parsedSalt && "salt" in parsedSalt) {
        try {
          return sdk.api.tx.court.denounceVote(
            caseId,
            draw.courtParticipant.toString(),
            {
              Outcome: {
                Categorical: selectedVoteOutcome.CategoricalOutcome[1],
              },
            },
            parsedSalt.salt,
          );
        } catch (error) {
          console.info("error", error);
        }
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
    setSecretInput("");
  };

  useEffect(() => {
    if (open) {
      setShowError(false);
    }
  }, [open]);

  return (
    <>
      <button
        className="center gap-2 rounded-md border-2 border-red-400 px-2 py-1 text-sm text-red-400"
        onClick={() => setOpen(true)}
      >
        <BsShieldFillExclamation size={12} />
        <span className="hidden md:block">Denounce</span>
      </button>

      <Modal open={open} onClose={onClose}>
        <Dialog.Panel className="relative max-w-[640px] rounded-ztg-10 bg-white p-[15px]">
          <h3 className="mb-2">Denounce Vote</h3>
          <p className="mb-4 text-sm text-gray-500">
            Denouncing a vote should be done if a vote has been revealed during
            the voting phase. To denounce you have to know the <b>outcome</b>{" "}
            the juror voted for and the <b>salt</b> that was used when voting.
          </p>
          <div className="mb-4 flex items-center">
            <label className="flex flex-1 items-center gap-1 text-gray-500">
              Vote
              <InfoPopover>
                You have to know the outcome the juror voted for.
              </InfoPopover>
            </label>
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
          <div className="mb-2 flex items-center">
            <label className="flex flex-1 items-center gap-1 text-gray-500">
              Salt
              <InfoPopover>
                Either the salt used when the juror voted or the secret phrase
                that was used to generate the salt is valid input.
              </InfoPopover>
            </label>
            <div className="w-2/3">
              <Input
                type="text"
                value={secretInput}
                onChange={(e) => {
                  setSecretInput(e.target.value);
                }}
                onBlur={(e) => setShowError(Boolean(e.target.value))}
                className="w-full text-sm"
                placeholder={`0x..... or 12 word secret phrase `}
              />
            </div>
          </div>
          <div className="mb-4 mr-4 mt-2 h-6 text-right">
            {parsedSalt && "error" in parsedSalt && showError && (
              <div className="text-xs text-red-400">{parsedSalt.error}</div>
            )}
          </div>

          <TransactionButton
            disabled={isLoading || isBroadcasting || !isReady}
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
