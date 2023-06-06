import { useState } from "react";
import LiquidityModal from "./LiquidityModal";

const ManageLiquidityButton = ({ poolId }: { poolId: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="text-mariner font-semibold text-ztg-14-120"
        onClick={() => setIsOpen(true)}
      >
        Manage
      </button>
      <LiquidityModal
        poolId={poolId}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default ManageLiquidityButton;
