import { useUserLocation } from "lib/hooks/useUserLocation";
import { observer } from "mobx-react";

const TwitterIcon = observer(() => {
  return (
    <svg
      width="20"
      height="16"
      viewBox="0 0 20 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.688 1.89386C18.9642 2.21541 18.1852 2.43195 17.3682 2.52973C18.2023 2.02969 18.8427 1.23829 19.144 0.295298C18.3644 0.75859 17.4988 1.09392 16.5794 1.2757C15.8425 0.490854 14.7919 0 13.631 0C11.4005 0 9.59199 1.80855 9.59199 4.03904C9.59199 4.35534 9.62809 4.66377 9.69699 4.95972C6.33976 4.79173 3.36379 3.18333 1.3715 0.739561C1.02371 1.33607 0.824871 2.0297 0.824871 2.76992C0.824871 4.17095 1.53687 5.40727 2.62161 6.13174C1.95882 6.11074 1.33672 5.92897 0.791402 5.62645V5.67697C0.791402 7.63448 2.18456 9.26651 4.03117 9.63859C3.69256 9.73046 3.33557 9.78033 2.96743 9.78033C2.70691 9.78033 2.45361 9.75473 2.20687 9.70749C2.72069 11.3119 4.21294 12.48 5.98015 12.5128C4.59815 13.5956 2.85653 14.242 0.963988 14.242C0.63719 14.242 0.315643 14.2229 0 14.1849C1.78755 15.3306 3.91042 16 6.19145 16C13.6205 16 17.6832 9.84529 17.6832 4.50824C17.6832 4.33303 17.6799 4.15848 17.6714 3.98589C18.4615 3.41498 19.1466 2.70363 19.688 1.89386Z"
        fill={"black"}
      />
    </svg>
  );
});

export default TwitterIcon;
