import ipRangeCheck from "ip-range-check";
import { useAtom } from "jotai";
import { atomsWithQuery } from "jotai-tanstack-query";

export type UserLocation = {
  isUsingVPN: boolean;
  locationAllowed: boolean;
};

export const userLocationKey = "user-location";

export const [userLocationDataAtom, userLocationStatusAtom] =
  atomsWithQuery<UserLocation>(() => ({
    queryKey: [userLocationKey],
    initialData: () => ({
      isUsingVPN: false,
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

      const ip = json.body.ip;

      //source: https://raw.githubusercontent.com/X4BNet/lists_vpn/main/output/datacenter/ipv4.txt
      const vpnIPsResponse = await fetch("/vpn-ips.txt");
      const vpnIPs = await vpnIPsResponse.text();
      const isUsingVPN = vpnIPs
        .toString()
        .split("\n")
        .some((vpnIP) => ipRangeCheck(ip, vpnIP) === true);

      return { isUsingVPN, locationAllowed };
    },
  }));

export const useUserLocation = () => {
  const [data] = useAtom(userLocationDataAtom);
  const [status] = useAtom(userLocationStatusAtom);
  return { ...data, ...status };
};
