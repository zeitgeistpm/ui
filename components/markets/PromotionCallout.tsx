import { Dialog } from "@headlessui/react";
import { IndexerContext, Market } from "@zeitgeistpm/sdk-next";
import Modal from "components/ui/Modal";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useMarketPromotionState } from "lib/state/promotions";
import moment from "moment";
import Image from "next/image";
import { AiFillFire } from "react-icons/ai";

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
              className="rounded-md bg-orange-200 p-4 inline-flex font-bold text-orange-900 cursor-pointer"
              onClick={() => toggle()}
            >
              Promoted Market! <i>(placeholder UI)</i>
              <AiFillFire size={24} />
            </div>
          </div>

          <Modal open={open} onClose={() => toggle(false)}>
            <Dialog.Panel
              className="flex flex-col gap-y-[20px] justify-center items-center bg-white 
    w-full max-w-[564px]  rounded-ztg-10"
            >
              <div className="w-full h-52 relative rounded-t-ztg-10 overflow-hidden">
                <Image
                  alt="AI Logan?"
                  src={props.promotion.imageUrl}
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="px-16 py-8">
                <h2 className="mb-12 text-xl center">
                  This market has promotional incentives!
                </h2>
                <div className="mb-14">
                  <ol className="list-decimal pl-[24px]">
                    <li className="mb-6 font-light">
                      Join our trading campaign on the prediction market for
                      <b className="font-medium">
                        {" "}
                        "{props.market.question}"
                      </b>{" "}
                      and get the chance to win big!
                    </li>
                    <li className="mb-6 font-light">
                      Make trades of{" "}
                      <b className="font-medium">
                        {props.promotion.tradeRequirement}+ $ZTG{" "}
                      </b>
                      and you'll be entered into a lucky draw to win a massive
                      <b className="font-medium">
                        {" "}
                        {props.promotion.prize} $ZTG
                      </b>{" "}
                      prize.
                    </li>
                    <li className="mb-6 font-light">
                      The campaign will only run until{" "}
                      <b className="font-medium">
                        {moment(props.promotion.timeSpan[1]).calendar()}
                      </b>
                      , so make sure to get your trades in before the deadline.
                    </li>
                    <li className="mb-6 font-light">
                      Don't miss out on this exciting opportunity to test your
                      knowledge and earn rewards!
                    </li>
                  </ol>
                </div>
                <button
                  onClick={() => toggle(false)}
                  className={`ztg-transition bg-ztg-blue text-white focus:outline-none disabled:opacity-20 disabled:cursor-default 
        rounded-full w-full mb-8 font-bold text-ztg-16-150 h-ztg-56`}
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
