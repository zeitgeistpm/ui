const ClearAllButton = ({ clear }) => {
  return (
    <button
      className="flex items-center rounded-md border border-sky-600 bg-white px-2 py-1 text-sm font-semibold text-sky-800 transition-all hover:bg-sky-50"
      onClick={clear}
    >
      Clear All
    </button>
  );
};

export default ClearAllButton;
