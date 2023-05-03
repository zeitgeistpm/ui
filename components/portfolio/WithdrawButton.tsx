const WithdrawButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Withdraw</button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <WithdrawModal />
      </Modal>
    </>
  );
};

const WithdrawModal = () => {
  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3>Withdraw</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <div className="flex gap-4">
          <div>Zeitgeist</div>
          <ArrowRight />
          <div>Polkadot</div>
        </div>
        <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal">
          <input
            type="number"
            className="w-full bg-transparent outline-none !text-center"
          />
          <div className="mr-[10px] absolute right-0">DOT</div>
        </div>
        <TransactionButton className="w-full max-w-[250px]">
          Confirm Withdraw
        </TransactionButton>
      </div>
    </Dialog.Panel>
  );
};

export default WithdrawButton;
