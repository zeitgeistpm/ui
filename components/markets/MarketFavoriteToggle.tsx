import { useFavoriteMarketsStorage } from "lib/state/favorites";
import { MdFavorite, MdFavoriteBorder } from "react-icons/md";

export const MarketFavoriteToggle = ({
  marketId,
  size,
}: {
  marketId: number;
  size?: number;
}) => {
  const { add, remove, isFavorite } = useFavoriteMarketsStorage();
  const favorited = isFavorite(marketId);

  return (
    <div className="group relative">
      <div
        className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg backdrop-blur-sm transition-all hover:scale-110 hover:opacity-95 hover:shadow-md ${
          favorited
            ? "bg-red-100/80 hover:bg-red-200/80"
            : "bg-gray-100/60 hover:bg-gray-200/60"
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          favorited ? remove(marketId) : add(marketId);
        }}
      >
        {favorited ? (
          <MdFavorite className="text-red-600" size={size ?? 14} />
        ) : (
          <MdFavoriteBorder className="text-gray-500" size={size ?? 14} />
        )}
      </div>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white/90 shadow-lg">
          {favorited ? "Remove from favorites" : "Add to favorites"}
        </div>
      </div>
    </div>
  );
};

export default MarketFavoriteToggle;
