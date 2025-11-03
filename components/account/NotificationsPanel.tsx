import { Transition } from "@headlessui/react";
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
import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AiOutlineEye, AiOutlineFileAdd } from "react-icons/ai";
import { BiMoneyWithdraw } from "react-icons/bi";
import { X } from "react-feather";
import { LuClipboardCheck, LuVote } from "react-icons/lu";
import { useMobileViewport } from "lib/hooks/useMobileViewport";
import { useSimpleScrollLock } from "lib/hooks/useSimpleScrollLock";
import { useMenuSwipeToClose } from "lib/hooks/useSwipeGesture";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel = ({
  isOpen,
  onClose,
}: NotificationsPanelProps) => {
  const wallet = useWallet();
  const { alerts, clearAll } = useAlerts(wallet.realAddress);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize mobile viewport handling
  useMobileViewport();

  // Enable swipe-to-close on mobile (swipe left to close)
  const { menuRef } = useMenuSwipeToClose(isOpen, onClose, "left");

  // Ensure component is mounted before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect mobile
  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Lock body scroll when panel is open
  useSimpleScrollLock(isOpen);

  // Don't render until mounted to avoid SSR issues
  if (!mounted) return null;

  const panelContent = (
    <>
      {/* Backdrop - full screen coverage with proper blur */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="fixed inset-0 bg-ztg-primary-950/50 backdrop-blur-md"
          aria-hidden="true"
          onClick={onClose}
          style={{ zIndex: 998 }}
        />
      </Transition>

      {/* Panel - glass morphism design system */}
      <Transition
        as={Fragment}
        show={isOpen}
        enter="ease-out duration-300"
        enterFrom="transform -translate-x-full opacity-0"
        enterTo="transform translate-x-0 opacity-100"
        leave="ease-in duration-200"
        leaveFrom="transform translate-x-0 opacity-100"
        leaveTo="transform -translate-x-full opacity-0"
      >
        <div
          ref={menuRef}
          className={`subtle-scroll-bar subtle-scroll-bar-on-hover
            fixed left-0 top-0 w-full overflow-y-auto
            border-r-2 border-white/10 bg-white/10 p-4
            shadow-xl ring-2 ring-white/5 backdrop-blur-lg focus:outline-none
            sm:min-w-[50vw] md:max-w-[700px] md:p-6
            ${isMobile ? "pt-16" : "pt-4"}`}
          style={{
            zIndex: 999,
            height: "calc(var(--vh, 1vh) * 100)",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
            paddingTop: isMobile
              ? "calc(64px + env(safe-area-inset-top, 0px))"
              : "16px",
          }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b-2 border-white/10 pb-4">
            <h2 className="text-xl font-bold text-white md:text-2xl">
              Notifications
            </h2>
            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <button
                  onClick={clearAll}
                  className="touch-manipulation rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                <p className="text-base text-white/70">No notifications</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg">
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
                    <UnknownAlertItem alert={alert} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Transition>
    </>
  );

  // Use React Portal to render outside of TopBar's stacking context
  return createPortal(panelContent, document.body);
};

const AlertCard: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick }) => (
  <div
    className="cursor-pointer rounded-lg border border-white/10 bg-white/10 px-4 py-3.5 backdrop-blur-sm transition-all hover:border-ztg-green-500/40 hover:bg-white/15 hover:shadow-lg hover:shadow-black/20"
    onClick={onClick}
  >
    {children}
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
  }, [alert, router]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500/30 to-blue-600/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <LuClipboardCheck size={14} className="text-white" />
          <span className="text-white">Ready to Settle</span>
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">
          {market?.question}
        </h3>
        <p className="text-xs text-white/75">
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
  }, [alert, router]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/30 to-purple-600/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <LuVote size={14} className="text-white" />
          <span className="text-white">Ready for Vote</span>
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">
          {market?.question}
        </h3>
        <p className="text-xs text-white/75">
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
  }, [alert, router]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/court/${alert.caseId}`);
      }}
    >
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-500/30 to-purple-600/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <AiOutlineEye size={14} className="text-white" />
          <span className="text-white">Ready to Reveal</span>
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold text-white">
          {market?.question}
        </h3>
        <p className="text-xs text-white/75">
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
  }, [alert, router]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/markets/${alert.market.marketId}`);
      }}
    >
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/30 to-pink-600/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <AiOutlineFileAdd size={14} className="text-white" />
          <span className="text-white">Submit Report</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">
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
  }, [alert, wallet.realAddress, router]);

  return (
    <AlertCard
      onClick={() => {
        router.push(`/portfolio/${wallet.realAddress}`);
      }}
    >
      <div className="mb-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-ztg-green-500/30 to-blue-600/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
          <BiMoneyWithdraw size={14} className="text-white" />
          <span className="text-white">Redeemable Tokens</span>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">
          You have {alert.markets.length} redeemable markets
        </h3>
      </div>
    </AlertCard>
  );
};

const RelevantMarketDisputeItem = ({}: {
  alert: RelevantMarketDisputeAlertData;
}) => {
  return (
    <AlertCard>
      <div className="text-sm font-semibold text-white">Market Dispute</div>
      <p className="text-xs text-white/75">
        A market you're involved in is disputed
      </p>
    </AlertCard>
  );
};

const UnknownAlertItem = ({ alert }: { alert: never }) => {
  console.warn("Unknown alert type:", alert);
  return <></>;
};
