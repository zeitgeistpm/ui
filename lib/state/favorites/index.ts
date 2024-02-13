import { useAtom } from "jotai";
import { persistentAtom } from "../util/persistent-atom";

export type FavoriteMarket = {
  marketId: number;
};

export type UseFavoriteMarkets = {
  add: (marketId: number) => void;
  remove: (marketId: number) => void;
  isFavorite: (marketId: number) => boolean;
  favorites: FavoriteMarket[];
};

const favoriteMarketsAtom = persistentAtom<{ markets: FavoriteMarket[] }>({
  key: "favorite-markets",
  defaultValue: { markets: [] },
  migrations: [],
});

export const useFavoriteMarketsStorage = (): UseFavoriteMarkets => {
  const [favoriteMarkets, setFavoriteMarkets] = useAtom(favoriteMarketsAtom);

  const add = (marketId: number) => {
    if (
      favoriteMarkets.markets.some((favorite) => favorite.marketId === marketId)
    )
      return;

    setFavoriteMarkets((state) => ({
      markets: [
        ...state.markets,
        {
          marketId,
        },
      ],
    }));
  };

  const remove = (marketId: number) => {
    setFavoriteMarkets((state) => ({
      markets: state.markets.filter(
        (favorite) => favorite.marketId !== marketId,
      ),
    }));
  };

  const isFavorite = (marketId: number) => {
    return favoriteMarkets.markets.some(
      (favorite) => favorite.marketId === marketId,
    );
  };

  return {
    add,
    remove,
    isFavorite,
    favorites: favoriteMarkets.markets,
  };
};
