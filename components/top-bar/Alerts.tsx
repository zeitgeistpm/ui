import { Menu, Transition } from "@headlessui/react";
import {
  ReadyToReportMarketAlertData,
  RedeemableMarketsAlertData,
  RelevantMarketDisputeAlertData,
  useAlerts,
} from "lib/state/alerts";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import { Fragment, PropsWithChildren, useEffect, useState } from "react";
import { AiOutlineFileAdd } from "react-icons/ai";
import { BiMoneyWithdraw } from "react-icons/bi";
import { IoMdNotificationsOutline } from "react-icons/io";

export const Alerts = () => {
  const wallet = useWallet();
  const { alerts, setAsRead } = useAlerts(wallet.realAddress);

  const hasNotifications = alerts.length > 0;

  const [hoveringMenu, setHoveringMenu] = useState(false);

  const mouseEnterMenuHandler = () => {
    setHoveringMenu(true);
  };
  const mouseLeaveMenuHandler = () => {
    setHoveringMenu(false);
  };

  return (
    <Menu as="div" className="relative z-50">
      {({ open, close }) => {
        return (
          <>
            <div className="flex gap-2">
              <Menu.Button
                disabled={alerts.length === 0}
                className="text-white font-light relative flex center gap-2"
              >
                <div
                  className={`transition-all ${
                    hasNotifications
                      ? "text-gray-200 cursor-pointer"
                      : "text-gray-500"
                  }`}
                >
                  <IoMdNotificationsOutline
                    className="transition-all"
                    size={24}
                  />
                  {hasNotifications && (
                    <div className="absolute animate-pulse-scale top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              show={open && hoveringMenu}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0"
              enterTo="transform opacity-1"
              leave="transition ease-in opacity-0 duration-75"
              leaveFrom="transform opacity-1"
              leaveTo="transform opacity-0 "
            >
              <div
                className="fixed z-40 left-0 top-0 h-screen w-screen bg-black/10 backdrop-blur-sm"
                aria-hidden="true"
              />
            </Transition>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform -translate-y-2"
              enterTo="transform translate-y-0 "
              leave="transition ease-in translate-y-2 duration-75"
              leaveFrom="transform translate-y-0"
              leaveTo="transform opacity-0 -translate-y-2"
            >
              <Menu.Items
                onMouseEnter={mouseEnterMenuHandler}
                onMouseLeave={mouseLeaveMenuHandler}
                className={`
                  fixed md:absolute left-0 md:translate-x-[50%] md:left-auto p-2 md:px-4 md:max-h-[700px] 
                  overflow-y-scroll md:right-0 bottom-0 md:bottom-auto z-50 py-3 top-11 
                  md:top-auto mt-6 md:mt-6 w-full overflow-hidden h-full md:h-auto md:w-96 pb-20 md:pb-0 
                  origin-top-right divide-gray-100 md:rounded-md focus:outline-none  
                  bg-black/20 md:bg-transparent 
                  subtle-scroll-bar subtle-scroll-bar-on-hover 
                `}
              >
                {alerts.map((alert) => (
                  <Menu.Item key={alert.id}>
                    <div>
                      {alert.type === "ready-to-report-market" ? (
                        <ReadyToReportMarketAlertItem alert={alert} />
                      ) : alert.type === "market-dispute" ? (
                        <RelevantMarketDisputeItem alert={alert} />
                      ) : alert.type === "redeemable-markets" ? (
                        <RedeemableMarketAlertItem alert={alert} />
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
  <div className="mb-2 md:hover:scale-105 hover:ring-1 ring-[#fa8cce] rounded-md transition-all cursor-pointer">
    <div
      className="bg-white/80 md:bg-white/50 border-1 border-solid border-black/10 backdrop-blur-lg py-3 px-4 rounded-md"
      onClick={onClick}
    >
      {children}
    </div>
  </div>
);

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
          className="rounded-full py-1 px-1.5 inline-flex text-xxs items-center gap-1"
          style={{
            background:
              "linear-gradient(131.15deg, rgba(240, 206, 135, 0.4) 11.02%, rgba(254, 0, 152, 0.4) 93.27%)",
          }}
        >
          <AiOutlineFileAdd size={12} className="text-gray-700" />
          Submit Report
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium pl-1">{alert.market.question}</h3>
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
          className="rounded-full py-1 px-1.5 inline-flex text-xxs items-center gap-1"
          style={{
            background:
              "linear-gradient(131.15deg, rgba(50, 255, 157, 0.4) 11.02%, rgb(142 185 231 / 38%) 93.27%)",
          }}
        >
          <BiMoneyWithdraw size={12} className="text-gray-600" />
          Redeemable Tokens
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium pl-1">
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
