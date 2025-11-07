const ClearAllButton = ({ clear }) => {
  return (
    <button
      className="flex items-center rounded-md bg-white/15 px-2 py-1 text-sm font-semibold text-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white/20"
      onClick={clear}
    >
      Clear All
    </button>
  );
};

export default ClearAllButton;
