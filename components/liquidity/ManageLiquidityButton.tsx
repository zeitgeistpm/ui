import Modal from "components/ui/Modal";
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
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <LiquidityModal poolId={poolId} />
      </Modal>
    </>
  );
};

export default ManageLiquidityButton;
