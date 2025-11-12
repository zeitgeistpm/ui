import { Dialog } from "@headlessui/react";
import { IndexerContext, Market } from "@zeitgeistpm/sdk";
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
  const startDate = props.promotion.timeSpan
    ? new Date(props.promotion.timeSpan[0])
    : undefined;
  const endDate = props.promotion.timeSpan
    ? new Date(props.promotion.timeSpan[1])
    : undefined;
  const isActive =
    (startDate && endDate && startDate < now && endDate > now) ?? false;

  const { open, toggle } = useMarketPromotionState(props.market.marketId, {
    defaultOpenedState: isActive,
  });

  return (
    <>
      {isActive && (
        <div>
          <div className="flex justify-center">
            <div
              className="cursor-pointer rounded-md bg-green-lighter px-2 py-1 text-sm"
              onClick={() => toggle()}
            >
              <span>Promo Market</span>
              <span className="text-blue-600"> Rules</span>
            </div>
          </div>

          <Modal open={open} onClose={() => toggle(false)}>
            <Dialog.Panel
              className="flex max-h-screen w-full max-w-[564px] flex-col items-center 
    justify-center rounded-ztg-10  bg-white"
            >
              <div className="relative mb-4 h-40 w-full overflow-hidden rounded-t-ztg-10 lg:h-52">
                {props.promotion.imageUrl && (
                  <Image
                    alt="Market Promotion Banner Image"
                    src={props.promotion.imageUrl}
                    fill
                    style={{
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
              <div className="px-8 py-4 lg:px-16 lg:py-8">
                <h2 className="center mb-8 text-center text-xl lg:mb-12 lg:text-left">
                  This market has promotional incentives!
                </h2>
                <div className="mb-8 lg:mb-14">
                  <ol className="crystal-ball-emoji-list list-decimal pl-[24px]">
                    <li className="mb-4 font-light lg:mb-6">
                      If you trade in this prediction market, you stand the
                      chance of winning considerable prizes!
                    </li>
                    <li className="mb-4 font-light lg:mb-6">
                      To enter, simply make a trade in this market of{" "}
                      {props.promotion.tradeRequirement} ZTG or more. By doing
                      so, you will automatically be entered into a lucky draw to
                      win {props.promotion.prize} ZTG!{" "}
                      <i>
                        (Of course, this would be in addition to the rewards you
                        will receive if you predict correctly.)
                      </i>
                    </li>
                    {props.promotion.timeSpan && (
                      <li className="mb-4 font-light lg:mb-6">
                        This promotion will run until{" "}
                        <b>
                          {moment(props.promotion.timeSpan[1]).format(
                            "Do of MMMM YYYY",
                          )}
                        </b>
                        , so make sure to get your trades in soon!
                      </li>
                    )}
                  </ol>
                </div>
                <button
                  onClick={() => toggle(false)}
                  className={`ztg-transition mb-4 h-ztg-56 w-full rounded-full bg-ztg-green-600/80 
        text-ztg-16-150 font-bold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md focus:outline-none disabled:cursor-default disabled:opacity-20 lg:mb-8`}
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
