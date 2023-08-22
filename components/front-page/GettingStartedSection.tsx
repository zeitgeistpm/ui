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
          <CreateAccountActionableCard />
          <DepositActionableCard />
          <StartTradingActionableCard />
        </div>
      </div>
    </>
  );
};

export default GettingStartedSection;
