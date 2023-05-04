import { Dialog } from "@headlessui/react";
import { IndexerContext, Market } from "@zeitgeistpm/sdk-next";
import Modal from "components/ui/Modal";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useMarketPromotionState } from "lib/state/promotions";
import moment from "moment";
import Image from "next/image";

export const MarketPromotionCallout = (props: {
  market: Market<IndexerContext> | MarketPageIndexedData;
  promotion: PromotedMarket;
}) => {
  const now = new Date();
  const startDate = new Date(props.promotion.timeSpan[0]);
  const endDate = new Date(props.promotion.timeSpan[1]);
  const isActive = startDate < now && endDate > now;

  const { open, toggle } = useMarketPromotionState(props.market.marketId, {
    defaultOpenedState: isActive,
  });

  return (
    <>
      {isActive && (
        <div>
          <div className="flex justify-center">
            <div
              className="rounded-md bg-green-lighter p-2 text-sm cursor-pointer"
              onClick={() => toggle()}
            >
              <span>Promo Market</span>
              <span className="text-blue-600"> Rules</span>
            </div>
          </div>

          <Modal open={open} onClose={() => toggle(false)}>
            <Dialog.Panel
              className="flex flex-col max-h-screen justify-center items-center bg-white 
    w-full max-w-[564px]  rounded-ztg-10"
            >
              <div className="w-full h-40 lg:h-52 mb-4 relative rounded-t-ztg-10 overflow-hidden">
                <Image
                  alt="Market Promotion Banner Image"
                  src={props.promotion.imageUrl}
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="px-8 py-4 lg:px-16 lg:py-8">
                <h2 className="mb-8 lg:mb-12 text-xl center text-center lg:text-left">
                  This market has promotional incentives!
                </h2>
                <div className="mb-8 lg:mb-14">
                  <ol className="list-decimal pl-[24px] crystal-ball-emoji-list">
                    <li className="mb-4 lg:mb-6 font-light">
                      If you trade in this prediction market, you stand the
                      chance of winning considerable prizes!
                    </li>
                    <li className="mb-4 lg:mb-6 font-light">
                      To enter, simply make a trade in this market of{" "}
                      {props.promotion.tradeRequirement} ZTG or more. By doing
                      so, you will automatically be entered into a lucky draw to
                      win {props.promotion.prize} ZTG!{" "}
                      <i>
                        (Of course, this would be in addition to the rewards you
                        will receive if you predict correctly.)
                      </i>
                    </li>
                    <li className="mb-4 lg:mb-6 font-light">
                      This promotion will run until{" "}
                      <b>
                        {moment(props.promotion.timeSpan[1]).format(
                          "Do of MMMM YYYY",
                        )}
                      </b>
                      , so make sure to get your trades in soon!
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => toggle(false)}
                  className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full mb-4 lg:mb-8 font-bold text-ztg-16-150 h-ztg-56`}
                >
                  Got it!
                </button>
              </div>
            </Dialog.Panel>
          </Modal>
        </div>
      )}
    </>
  );
};
