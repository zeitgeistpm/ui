import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import TransactionButton from "components/ui/TransactionButton";
import { useCourtStore } from "lib/stores/CourtStore";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { HelpCircle } from "react-feather";

const SLASH_PERCENTAGE = Number(process.env.NEXT_PUBLIC_JUROR_SLASH_PERCENTAGE);

const JurorStatusPill = ({ active }: { active: boolean }) => {
  const { activeJurorStake } = useCourtStore();
  const { config } = useStore();
  const [hoveringInfo, setHoveringInfo] = useState<boolean>(false);
  const activeColorClasses = "border-sheen-green text-sheen-green";
  const tardyColorClasses = "border-vermilion text-vermilion";

  const handleMouseEnter = () => {
    setHoveringInfo(true);
  };

  const handleMouseLeave = () => {
    setHoveringInfo(false);
  };

  return (
    <div
      className={`ml-auto border-1 rounded-ztg-50 pl-ztg-10 py-ztg-3 pr-ztg-5 flex items-center mr-ztg-20 ${
        active === true ? activeColorClasses : tardyColorClasses
      }`}
    >
      <span className="font-bold text-ztg-12-150 mr-ztg-15">
        {active === true ? "Active" : "Tardy"}
      </span>
      <div>
        <HelpCircle
          size={20}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline cursor-pointer ml-ztg-10 mb-ztg-2"
        />
        {hoveringInfo === true ? (
          <div className="bg-white dark:bg-black absolute rounded-ztg-10 text-black dark:text-white px-ztg-8 py-ztg-14  text-ztg-12-150 w-ztg-240">
            <div className="font-bold mb-ztg-4">
              {active === true ? "Active Juror" : "Tardy Juror"}
            </div>
            <div className="mb-ztg-2">
              Your stake: {activeJurorStake} {config.tokenSymbol}
            </div>
            <div className="">
              {active === true
                ? "You have never missed a court date."
                : `You have failed to vote on a court case that you were assigned. If you fail to vote on another assigned case your stake will to slashed by ${SLASH_PERCENTAGE}% and you will be removed from the court `}
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

const JoinModalContent = observer(() => {
  const store = useStore();
  const { wallets } = store;
  const notificationStore = useNotificationStore();
  const modalStore = useModalStore();
  const { onJurorChange, jurors } = useCourtStore();

  const handleJoinCourt = () => {
    const signer = wallets.getActiveSigner() as ExtSigner;

    const tx = store.sdk.api.tx.court.joinCourt();
    signAndSend(
      tx,
      signer,
      extrinsicCallback({
        notificationStore,
        successCallback: () => {
          onJurorChange();
          modalStore.closeModal();

          notificationStore.pushNotification("Successfully joined Court", {
            type: "Success",
          });
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            { type: "Error" },
          );
        },
      }),
    );
  };

  useEffect(() => {
    modalStore.setOnEnterKeyPress(() => handleJoinCourt());
  }, [modalStore, handleJoinCourt]);

  return (
    <div className="text-ztg-12-150" style={{ width: "300px" }}>
      <div className="flex font-bold text-ztg-14-150 ">
        <div>Stake:</div>
        <div className="ml-ztg-15">
          {store.config.court.stakeWeight * (jurors.length + 1)}{" "}
          {store.config.tokenSymbol}
        </div>
      </div>
      <div className="font-bold text-ztg-14-150 mt-ztg-10">Rewards</div>
      <div>
        <ul className="list-disc list-inside text-ztg-blue">
          <li>
            <span className="text-black dark:text-white">
              If you reach consensus with other jurors you will be rewarded with
              a percentage of the losing disputer's bond.
            </span>
          </li>
        </ul>
      </div>
      <div className="font-bold text-ztg-14-150 mt-ztg-10">Penalties</div>
      <ul className="list-disc list-inside text-ztg-blue">
        <li>
          <span className="text-black dark:text-white">
            If you fail to vote on an assigned case your juror status will
            change to 'Tardy', if you fail to vote again you will removed from
            Court and your stake will be slashed by {SLASH_PERCENTAGE}%.
          </span>
        </li>
        <li>
          <span className="text-black dark:text-white">
            If you fail to vote for the top two outcomes your stake will be
            slashed by {SLASH_PERCENTAGE}%.
          </span>
        </li>
      </ul>
      <TransactionButton
        className="!rounded-ztg-10 h-ztg-50 mt-ztg-20"
        onClick={handleJoinCourt}
      >
        Join court
      </TransactionButton>
    </div>
  );
});

const ExitModalContent = observer(() => {
  const store = useStore();
  const { wallets } = store;
  const notificationStore = useNotificationStore();
  const modalStore = useModalStore();
  const { onJurorChange } = useCourtStore();

  const handleExitCourt = () => {
    const signer = wallets.getActiveSigner() as ExtSigner;

    const tx = store.sdk.api.tx.court.exitCourt();
    signAndSend(
      tx,
      signer,
      extrinsicCallback({
        notificationStore,
        successCallback: () => {
          onJurorChange();
          modalStore.closeModal();

          notificationStore.pushNotification("Successfully exited Court", {
            type: "Success",
          });
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            { type: "Error" },
          );
        },
      }),
    );
  };

  useEffect(() => {
    modalStore.setOnEnterKeyPress(() => handleExitCourt());
  }, [modalStore, handleExitCourt]);

  return (
    <div>
      <div className="font-bold text-ztg-14-150">
        You will be removed from the Court and your stake will be returned.
      </div>
      <TransactionButton
        className="!rounded-ztg-10 h-ztg-50 mt-ztg-20"
        onClick={handleExitCourt}
      >
        Exit court
      </TransactionButton>
    </div>
  );
});

const CourtHeader = observer(() => {
  const { activeJurorStatus } = useCourtStore();
  const modalStore = useModalStore();

  const handleJoinCourtClick = () => {
    modalStore.openModal(<JoinModalContent />, <>"Join Court"</>, {
      styles: { width: "330px" },
    });
  };

  const handleExitCourtClick = () => {
    modalStore.openModal(<ExitModalContent />, <>"Exit Court"</>, {
      styles: { width: "330px" },
    });
  };

  return (
    <>
      <div className="flex items-center mb-ztg-22">
        <h2 className="header ">Court</h2>
        {activeJurorStatus !== null ? (
          <JurorStatusPill active={activeJurorStatus === "OK"} />
        ) : (
          <></>
        )}
        {activeJurorStatus !== null ? (
          <button
            className="font-bold text-white text-ztg-12-150 px-ztg-20 py-ztg-7 bg-rose rounded-ztg-100"
            onClick={handleExitCourtClick}
          >
            Unstake and Leave Court
          </button>
        ) : (
          <button
            className="font-bold text-white text-ztg-12-150 px-ztg-20 py-ztg-7 bg-fushsia rounded-ztg-100 ml-auto"
            onClick={handleJoinCourtClick}
          >
            Stake and Join Court
          </button>
        )}
      </div>
      <img className="w-full mb-ztg-30" src="/court.png" />
    </>
  );
});

export default CourtHeader;
