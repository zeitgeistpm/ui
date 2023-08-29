import { CreateAccountActionableCard } from "components/ui/actionable/cards/CreateAccount";
import { DepositActionableCard } from "components/ui/actionable/cards/Deposit";
import { StartTradingActionableCard } from "components/ui/actionable/cards/StartTrading";

const GettingStartedSection = () => {
  return (
    <>
      <div className="w-full" data-testid="learnSection">
        <h2 className="sm:col-span-3 text-center sm:text-start mb-6">
          Getting Started
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
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
