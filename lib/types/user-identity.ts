export type Judgement =
  | "Unknown"
  | "FeePaid"
  | "Reasonable"
  | "KnownGood"
  | "OutOfDate"
  | "LowQuality"
  | "Erroneous";

export interface UserIdentity {
  displayName: string;
  discord: string;
  twitter: string;
  judgement?: Judgement;
}
