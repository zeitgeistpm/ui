import { NextPage } from "next";
import { FC } from "react";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  Layout?: FC | (() => JSX.Element);
};
