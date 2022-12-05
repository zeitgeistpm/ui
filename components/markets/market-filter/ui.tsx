export const ClearAllBtn = ({ clear }) => {
  return (
    <button
      className="flex px-ztg-10 py-ztg-5 bg-white rounded-ztg-5 text-black text-ztg-14-150 border-gray-800 border"
      onClick={clear}
    >
      Clear All
    </button>
  );
};
