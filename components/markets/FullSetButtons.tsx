import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { observer } from "mobx-react";
import BuyFullSetModal from "components/markets/BuyFullSetModal";
import SellFullSetModal from "components/markets/SellFullSetModal";

const FullSetButtons = observer(
  ({ marketStore }: { marketStore: MarketStore }) => {
    const modalStore = useModalStore();
    const modalOptions = {
      styles: { width: "304px" },
    };

    const handleBuyFullSetClick = () => {
      modalStore.openModal(
        <BuyFullSetModal marketStore={marketStore} />,
        "Buy Full Set",
        modalOptions
      );
    };

    const handleSellFullSetClick = () => {
      modalStore.openModal(
        <SellFullSetModal marketStore={marketStore} />,
        "Sell Full Set",
        modalOptions
      );
    };

    return (
      <div className="hidden sm:block">
        {marketStore.tradingEnabled ? (
          <>
            <button
              onClick={handleBuyFullSetClick}
              className="h-ztg-19 ml-ztg-20 text-sky-600 border-sky-600 rounded-ztg-100 border-2 text-ztg-10-150 px-ztg-10 font-bold"
            >
              Buy Full Set
            </button>
            <button
              onClick={handleSellFullSetClick}
              className="h-ztg-19 ml-ztg-15 text-sky-600 border-sky-600 rounded-ztg-100 border-2 text-ztg-10-150 px-ztg-10 font-bold"
            >
              Sell Full Set
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    );
  }
);

export default FullSetButtons;
