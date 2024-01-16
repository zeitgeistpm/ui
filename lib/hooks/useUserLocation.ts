import { useAtom } from "jotai";
import { atomsWithQuery } from "jotai-tanstack-query";

export type UserLocation = {
  locationAllowed: boolean;
};

export const userLocationKey = "user-location";

export const [userLocationDataAtom, userLocationStatusAtom] =
  atomsWithQuery<UserLocation>(() => ({
    queryKey: [userLocationKey],
    initialData: () => ({
      locationAllowed: true,
    }),
    keepPreviousData: true,
    queryFn: async () => {
      const response = await fetch(`/api/location`);
      const json = await response.json();

      const notAllowedCountries: string[] = JSON.parse(
        process.env.NEXT_PUBLIC_NOT_ALLOWED_COUNTRIES ?? "[]",
      );

      const userCountry: string = json.body.country;
      const locationAllowed = !notAllowedCountries.includes(userCountry);

      console.log("Location:", userCountry);
      console.log("Allowed:", locationAllowed);

      return { locationAllowed };
    },
  }));

export const useUserLocation = () => {
  const [data] = useAtom(userLocationDataAtom);
  const [status] = useAtom(userLocationStatusAtom);
  return { ...data, ...status };
};
