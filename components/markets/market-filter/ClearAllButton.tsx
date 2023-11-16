const ClearAllButton = ({ clear }) => {
  return (
    <button
      className="flex rounded-ztg-5 border border-gray-800 bg-white px-ztg-10 py-ztg-5 text-ztg-14-150 text-black"
      onClick={clear}
    >
      Clear All
    </button>
  );
};

export default ClearAllButton;
