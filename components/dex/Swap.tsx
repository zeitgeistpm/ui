import { useHydraSell } from "lib/hooks/queries/hydra/useHydraSwap";

const Swap = () => {
  const a = useHydraSell(1, 1);
  return <div>Swap</div>;
};

export default Swap;
