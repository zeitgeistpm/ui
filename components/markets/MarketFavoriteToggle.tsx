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

  return (
    <div
      className="ztg-transition relative inline-block transition-transform duration-200 active:scale-150"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        isFavorite(marketId) ? remove(marketId) : add(marketId);
      }}
    >
      {isFavorite(marketId) ? (
        <MdFavorite className="text-red-600" size={size ?? 16} />
      ) : (
        <MdFavoriteBorder className="text-gray-400" size={size ?? 16} />
      )}
    </div>
  );
};

export default MarketFavoriteToggle;
