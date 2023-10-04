import { Menu, Transition } from "@headlessui/react";
import {
  ReadyToReportMarketAlert,
  RedeemableMarketsAlert,
  RelevantMarketDisputeAlert,
  useAlerts,
} from "lib/hooks/useAlerts";
import { useWallet } from "lib/state/wallet";
import { useRouter } from "next/router";
import { Fragment, useEffect } from "react";
import { AiOutlineFileAdd } from "react-icons/ai";
import { BiMoneyWithdraw } from "react-icons/bi";
import { IoMdNotificationsOutline } from "react-icons/io";

export const Alerts = () => {
  const wallet = useWallet();
  const { alerts } = useAlerts(wallet.realAddress);

  const hasNotifications = alerts.length > 0;

  return (
    <Menu as="div" className="relative z-50">
      {({ open, close }) => {
        return (
          <>
            <div className="flex gap-2">
              <Menu.Button className="text-white font-light relative flex center gap-2">
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
              enter="transition ease-out duration-100"
              enterFrom="transform translate-y-2 md:translate-y-0 md:scale-95"
              enterTo="transform translate-y-0 md:scale-100"
              leave="transition ease-in translate-y-2 md:translate-y-0 duration-75"
              leaveFrom="transform translate-y-0 md:scale-100"
              leaveTo="transform opacity-0 translate-y-2 md:translate-y-0 md:scale-95"
            >
              <Menu.Items className="fixed md:absolute left-0 md:translate-x-[50%] md:left-auto p-2 md:px-4 md:max-h-[700px] overflow-y-scroll subtle-scroll-bar md:right-0 bottom-0 md:bottom-auto z-50 py-3 top-12 md:top-auto mt-6 md:mt-6 w-full overflow-hidden h-full md:h-auto md:w-96 pb-20 md:bg-transparent origin-top-right divide-gray-100 md:rounded-md  focus:outline-none">
                {alerts.map((alert, index) => (
                  <Menu.Item key={index}>
                    <div className="mb-2 md:hover:scale-105 transition-transform cursor-pointer">
                      {alert.type === "ready-to-report-market" ? (
                        <ReadyToReportMarketAlertItem alert={alert} />
                      ) : alert.type === "relevant-market-dispute" ? (
                        <RelevantMarketDisputeItem alert={alert} />
                      ) : alert.type === "redeemable-markets" ? (
                        <RedeemableMarketAlertItem alert={alert} />
                      ) : (
                        <>
                          {console.warn(
                            `No component implemented for Alert.type: ${
                              (alert as any).type
                            }`,
                          )}
                        </>
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

const ReadyToReportMarketAlertItem = ({
  alert,
}: {
  alert: ReadyToReportMarketAlert;
}) => {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(`/markets/${alert.market.marketId}`);
  }, [alert]);

  return (
    <div
      className="bg-white/50 border-1 border-solid border-black/10 backdrop-blur-lg py-3 px-4 rounded-md"
      style={{
        WebkitTransform: "translate3d(0,0,0)",
      }}
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
          <AiOutlineFileAdd size={12} className="text-gray-600" />
          Submit Report
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium pl-1">{alert.market.question}</h3>
      </div>
    </div>
  );
};

const RedeemableMarketAlertItem = ({
  alert,
}: {
  alert: RedeemableMarketsAlert;
}) => {
  const router = useRouter();
  const wallet = useWallet();

  useEffect(() => {
    router.prefetch(`/portfolio/${wallet.realAddress}`);
  }, [alert, wallet.realAddress]);

  return (
    <div
      className="bg-white/50 border-1 border-solid border-black/10 backdrop-blur-lg py-3 px-4 rounded-md"
      style={{
        WebkitTransform: "translate3d(0,0,0)",
      }}
      onClick={() => {
        router.push(`/portfolio/${wallet.realAddress}`);
      }}
    >
      <div className="mb-1">
        <div
          className="rounded-full py-1 px-1.5 inline-flex text-xxs items-center gap-1"
          style={{
            background:
              "linear-gradient(131.15deg, rgba(50, 255, 157, 0.4) 11.02%, rgba(240, 206, 135, 0.048) 93.27%)",
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
    </div>
  );
};

const RelevantMarketDisputeItem = ({
  alert,
}: {
  alert: RelevantMarketDisputeAlert;
}) => {
  return <div></div>;
};
