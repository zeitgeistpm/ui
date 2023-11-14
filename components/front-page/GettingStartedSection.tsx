import { CreateAccountActionableCard } from "components/ui/actionable/cards/CreateAccount";
import { DepositActionableCard } from "components/ui/actionable/cards/Deposit";
import { StartTradingActionableCard } from "components/ui/actionable/cards/StartTrading";

const GettingStartedSection = () => {
  return (
    <>
      <div className="w-full" data-testid="learnSection">
        <h2 className="mb-6 text-center sm:col-span-3 sm:text-start">
          Getting Started
        </h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <CreateAccountActionableCard animationVariant="right" />
          </div>
          <div className="flex-1">
            <DepositActionableCard animationVariant="center" />
          </div>
          <div className="flex-1">
            <StartTradingActionableCard animationVariant="left" />
          </div>
        </div>
      </div>
    </>
  );
};

export default GettingStartedSection;
