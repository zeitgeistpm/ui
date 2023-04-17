import { useQuery } from "@tanstack/react-query";
import ipRangeCheck from "ip-range-check";

export type UserLocation = {
  isUsingVPN: boolean;
  locationAllowed: boolean;
};

export const useUserLocation = () => {
  const { data, isFetched, isFetching, isError } = useQuery<UserLocation>(
    ["user-location"],
    async () => {
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
    {
      initialData: () => ({
        isUsingVPN: false,
        locationAllowed: false,
      }),
    },
  );

  return { ...data, isFetched, isFetching, isError };
};
