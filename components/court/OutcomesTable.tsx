import { AssetId, ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { Case, useCourtStore } from "lib/stores/CourtStore";
import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback } from "lib/util/tx";
import { observer } from "mobx-react";
import React from "react";

const OutcomesTable = observer(
  ({
    marketStore,
    courtCase,
  }: {
    marketStore: MarketStore;
    courtCase: Case;
  }) => {
    const store = useStore();
    const { wallets } = store;
    const modalStore = useModalStore();
    const notificationStore = useNotificationStore();
    const { onCaseChange } = useCourtStore();

    const columns: TableColumn[] = [
      {
        header: "Token",
        accessor: "token",
        type: "token",
        width: "100px",
      },
      {
        header: "Outcome",
        accessor: "outcome",
        type: "text",
      },
      {
        header: "Votes",
        accessor: "votes",
        type: "number",
        width: "50px",
      },
      {
        header: "",
        accessor: "voteButton",
        type: "component",
        width: "200px",
      },
    ];

    const handleVoteClick = async (assetId: AssetId) => {
      const { signer } = wallets.getActiveSigner() as ExtSigner;

      store.sdk.api.tx.court
        //@ts-ignore
        .vote(marketStore.id, { categorical: assetId.categoricalOutcome[1] })
        .signAndSend(
          wallets.activeAccount.address,
          { signer: signer },
          extrinsicCallback({
            notificationStore,
            successCallback: () => {
              modalStore.closeModal();
              onCaseChange(marketStore.id);
              notificationStore.pushNotification("Successfully voted", {
                type: "Success",
              });
            },
            failCallback: ({ index, error }) => {
              notificationStore.pushNotification(
                store.getTransactionError(index, error),
                { type: "Error" }
              );
            },
          })
        );
    };

    const getOutcomeVotes = (asset: AssetId) => {
      let votes = 0;

      courtCase?.votes.forEach((vote) => {
        //@ts-ignore
        if (Number(vote.asset.Categorical) === asset.categoricalOutcome[1]) {
          votes++;
        }
      });

      return votes;
    };

    const canVote = () => {
      return courtCase?.jurors.some(
        (j) => j.address === wallets.activeAccount?.address
      );
    };

    const data: TableData[] = marketStore?.marketOutcomes
      .filter((o) => o.metadata !== "ztg")
      .map((outcome) => ({
        outcome: outcome.metadata["name"],
        token: {
          color: outcome.metadata["color"],
          label: outcome.metadata["ticker"],
        },
        votes: getOutcomeVotes(outcome.asset),
        voteButton: (
          <div className="flex justify-end">
            <button
              onClick={() => handleVoteClick(outcome.asset)}
              className="bg-ztg-blue text-white rounded-ztg-5 px-ztg-30 py-ztg-8 focus:outline-none text-ztg-14-120 disabled:opacity-20 disabled:cursor-default"
              disabled={canVote() === false}
            >
              Vote
            </button>
          </div>
        ),
      }));

    return <Table data={data} columns={columns} />;
  }
);

export default OutcomesTable;
