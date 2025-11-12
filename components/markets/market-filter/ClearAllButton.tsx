const ClearAllButton = ({ clear }) => {
  return (
    <button
      className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2 py-2 text-xs font-semibold text-white/90 shadow-md backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 sm:px-2.5 sm:text-sm md:px-3"
      onClick={clear}
    >
      Clear All
    </button>
  );
};

export default ClearAllButton;
