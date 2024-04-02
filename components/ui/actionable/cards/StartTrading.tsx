import { ActionableCard, ActionableCardProps } from "../ActionableCard";

export const StartTradingActionableCard = ({
  animationVariant,
}: {
  animationVariant?: ActionableCardProps["animationVariant"];
}) => (
  <ActionableCard
    title="Start Trading"
    description="Our system is at your full disposal. View markets and start trading on your beliefs."
    link="/markets"
    linkText="Make Predictions"
    img="/learn/start_trading.png"
    timeUsage="No time limits"
    animationVariant={animationVariant}
  />
);
