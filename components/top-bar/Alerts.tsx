import { Menu, Transition } from "@headlessui/react";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useMarket } from "lib/hooks/queries/useMarket";
import {
  CourtCaseReadyForReveal,
  CourtCaseReadyForVote,
  CourtCaseReadyToSettle,
  ReadyToReportMarketAlertData,
  RedeemableMarketsAlertData,
  RelevantMarketDisputeAlertData,
  useAlerts,
} from "lib/state/alerts";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import {
  Fragment,
  PropsWithChildren,
  useEffect,
  useState,
  useRef,
} from "react";
import { AiOutlineEye, AiOutlineFileAdd } from "react-icons/ai";
import { BiMoneyWithdraw } from "react-icons/bi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { LuClipboardCheck, LuVote } from "react-icons/lu";
import { alertsButtonRef } from "./alertsRef";

export const Alerts = () => {
  const wallet = useWallet();
  const { alerts, setAsRead } = useAlerts(wallet.realAddress);

  const hasNotifications = alerts.length > 0;

  const [hoveringMenu, setHoveringMenu] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const mouseEnterMenuHandler = () => {
    setHoveringMenu(true);
  };
  const mouseLeaveMenuHandler = () => {
    setHoveringMenu(false);
  };

  // Set the ref so AccountButton can trigger it
  useEffect(() => {
    if (buttonRef.current) {
      alertsButtonRef.current = buttonRef.current;
    }
    return () => {
      if (alertsButtonRef.current === buttonRef.current) {
        alertsButtonRef.current = null;
      }
    };
  }, []);

  return (
    <Menu as="div" className="relative">
      {({ open, close }) => {
        return (
          <>
            <div className="flex gap-2">
              <Menu.Button
                ref={buttonRef}
                disabled={alerts.length === 0}
                className="center relative flex gap-2 rounded-lg bg-white/10 px-2 py-1 font-light text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <div
                  className={`transition-all ${
                    hasNotifications
                      ? "cursor-pointer text-white"
                      : "text-white/50"
                  }`}
                >
                  <IoMdNotificationsOutline
                    className="transition-all"
                    size={24}
                  />
                  {hasNotifications && (
                    <div className="absolute right-0 top-0 h-3 w-3 animate-pulse-scale rounded-full border-2 border-white/20 bg-ztg-green-500"></div>
                  )}
                </div>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              show={open}
              enter="transition-opacity ease-out duration-100"
              enterFrom="transform opacity-0"
              enterTo="transform opacity-1"
              leave="transition-opacity ease-in opacity-0 duration-75"
              leaveFrom="transform opacity-1"
              leaveTo="transform opacity-0 "
            >
              <div
                className="fixed left-0 top-0 z-[150] h-screen w-screen bg-black/10 backdrop-blur-sm"
                aria-hidden="true"
                onClick={close}
              />
            </Transition>

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform -translate-y-2 opacity-0"
              enterTo="transform translate-y-0 opacity-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform translate-y-0 opacity-100"
              leaveTo="transform -translate-y-2 opacity-0"
            >
              <Menu.Items
                onMouseEnter={mouseEnterMenuHandler}
                onMouseLeave={mouseLeaveMenuHandler}
                onWheelCapture={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className={`
                  subtle-scroll-bar subtle-scroll-bar-on-hover
                  fixed left-0 right-0 z-[200] h-[calc(100vh-50px)] w-screen overflow-y-auto
                  bg-ztg-primary-800/95 p-4 pb-20 backdrop-blur-md focus:outline-none
                  md:left-auto md:right-4 md:h-auto md:max-h-[664px] md:w-96
                  md:rounded-lg md:bg-white/10 md:p-4 md:pb-4
                  md:shadow-xl md:backdrop-blur-lg
                `}
                style={{
                  top: "var(--top-bar-height, 50px)",
                }}
              >
                {alerts.map((alert) => (
                  <Menu.Item key={alert.id}>
                    <div className="rounded-lg">
                      {alert.type === "ready-to-report-market" ? (
                        <ReadyToReportMarketAlertItem alert={alert} />
                      ) : alert.type === "market-dispute" ? (
                        <RelevantMarketDisputeItem alert={alert} />
                      ) : alert.type === "redeemable-markets" ? (
                        <RedeemableMarketAlertItem alert={alert} />
                      ) : alert.type === "court-case-ready-for-vote" ? (
                        <CourtCaseReadyForVoteAlertItem alert={alert} />
                      ) : alert.type === "court-case-ready-for-reveal" ? (
                        <CourtCaseReadyForRevealAlertItem alert={alert} />
                      ) : alert.type === "court-case-ready-to-settle" ? (
                        <CourtCaseReadyToSettleItem alert={alert} />
                      ) : (
                        // Including this prevents us from not exhausting the switch on alert type.
                        // Should never be reached but caught by the type system.
                        <UnknownAlertItem alert={alert} />
                      )}
                    </div>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
};

const AlertCard: React.FC<PropsWithChildren & { onClick?: () => void }> = ({
  children,
  onClick,
}) => (
  <div className="mb-3 cursor-pointer rounded-lg transition-all hover:scale-[1.02]">
    <div
      className={`rounded-lg bg-white/10 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:shadow-md`}
      onClick={onClick}
      style={{
        transform: "translate3d(0,0,0)",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

const CourtCaseReadyToSettleItem = ({
  alert,
}: {
  alert: CourtCaseReadyToSettle;
}) => {
  const router = useRouter();
  const { data: marketId } = useCaseMarketId(alert.caseId);
  const { data: market } = useMarket({ marketId: marketId! });

  useEffect(() => {
    router.prefetch(`/court/${alert.caseId}`);
  }, [alert]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-1">
        <div
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xxs"
          style={{
            background:
              "linear-gradient(131.15deg, rgb(36 104 226 / 22%) 11.02%, rgb(69 83 226 / 60%) 93.27%)",
          }}
        >
          <LuClipboardCheck size={12} className="text-white/90" />
          Ready to Settle
        </div>
      </div>
      <div className="pl-1">
        <h3 className="mb-1 text-sm font-medium text-white/90">
          {market?.question}
        </h3>
        <p className="text-xxs text-white/70">
          This court case can now be settled.
        </p>
      </div>
    </AlertCard>
  );
};

const CourtCaseReadyForVoteAlertItem = ({
  alert,
}: {
  alert: CourtCaseReadyForVote;
}) => {
  const router = useRouter();
  const { data: marketId } = useCaseMarketId(alert.caseId);
  const { data: market } = useMarket({ marketId: marketId! });

  useEffect(() => {
    router.prefetch(`/court/${alert.caseId}`);
  }, [alert]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-1">
        <div
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xxs"
          style={{
            background:
              "linear-gradient(131.15deg, rgb(135 238 240 / 40%) 11.02%, rgb(157 0 254 / 40%) 93.27%)",
          }}
        >
          <LuVote size={12} className="text-white/90" />
          Ready for vote
        </div>
      </div>
      <div className="pl-1">
        <h3 className="mb-1 text-sm font-medium text-white/90">
          {market?.question}
        </h3>
        <p className="text-xxs text-white/70">
          You have been drawn as juror for this market and can now vote.
        </p>
      </div>
    </AlertCard>
  );
};

const CourtCaseReadyForRevealAlertItem = ({
  alert,
}: {
  alert: CourtCaseReadyForReveal;
}) => {
  const router = useRouter();
  const { data: marketId } = useCaseMarketId(alert.caseId);
  const { data: market } = useMarket({ marketId: marketId! });

  useEffect(() => {
    router.prefetch(`/court/${alert.caseId}`);
  }, [alert]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-1">
        <div
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xxs"
          style={{
            background:
              "linear-gradient(131.15deg, rgb(135 240 170 / 40%) 11.02%, rgb(204 0 254 / 40%) 93.27%)",
          }}
        >
          <AiOutlineEye size={12} className="text-white/90" />
          Ready to reveal vote
        </div>
      </div>
      <div className="pl-1">
        <h3 className="mb-1 text-sm font-medium text-white/90">
          {market?.question}
        </h3>
        <p className="text-xxs text-white/70">
          You are required to reveal your vote for this court case.
        </p>
      </div>
    </AlertCard>
  );
};

const ReadyToReportMarketAlertItem = ({
  alert,
}: {
  alert: ReadyToReportMarketAlertData;
}) => {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/markets/${alert.market.marketId}`);
  }, [alert]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/markets/${alert.market.marketId}`);
      }}
    >
      <div className="mb-1">
        <div
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xxs"
          style={{
            background:
              "linear-gradient(131.15deg, rgba(240, 206, 135, 0.4) 11.02%, rgba(254, 0, 152, 0.4) 93.27%)",
          }}
        >
          <AiOutlineFileAdd size={12} className="text-white/90" />
          Submit Report
        </div>
      </div>
      <div className="pl-1">
        <h3 className="text-sm font-medium text-white/90">
          {alert.market.question}
        </h3>
      </div>
    </AlertCard>
  );
};

const RedeemableMarketAlertItem = ({
  alert,
}: {
  alert: RedeemableMarketsAlertData;
}) => {
  const router = useRouter();
  const wallet = useWallet();

  useEffect(() => {
    router.prefetch(`/portfolio/${wallet.realAddress}`);
  }, [alert, wallet.realAddress]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/portfolio/${wallet.realAddress}`);
      }}
    >
      <div className="mb-1">
        <div
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xxs"
          style={{
            background:
              "linear-gradient(131.15deg, rgba(50, 255, 157, 0.4) 11.02%, rgb(142 185 231 / 38%) 93.27%)",
          }}
        >
          <BiMoneyWithdraw size={12} className="text-white/90" />
          Redeemable Tokens
        </div>
      </div>
      <div className="pl-1">
        <h3 className="text-sm font-medium text-white/90">
          You have {alert.markets.length} redeemable markets.
        </h3>
      </div>
    </AlertCard>
  );
};

const RelevantMarketDisputeItem = ({
  alert,
}: {
  alert: RelevantMarketDisputeAlertData;
}) => {
  return <AlertCard></AlertCard>;
};

/**
 * @note Since the param here is `never` it prevents us from forgetting to add a case for a new alert type
 *  If a case for a alert type is missing in the rendering of the list, the compiler will complain.
 */
const UnknownAlertItem = ({ alert }: { alert: never }) => {
  return <></>;
};
