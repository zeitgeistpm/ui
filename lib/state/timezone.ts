import { useAtom } from "jotai";
import moment from "moment-timezone";
import { persistentAtom } from "./util/persistent-atom";

export type AppTimezone = {
  /**
   * User defined timezone.
   */
  timezone: string;
};

const appTimezoneAtom = persistentAtom<AppTimezone>({
  key: "timezone",
  defaultValue: {
    timezone: moment.tz.guess(),
  },
});

export type UseAppTimezone = {
  /**
   * User defined timezone.
   */
  timezone: string;

  /**
   * Changes the timezone.
   */
  setTimezone: (timezone: string) => void;
};

export const useAppTimezone = (): UseAppTimezone => {
  const [state, setState] = useAtom(appTimezoneAtom);

  const setTimezone = (timezone: string) => {
    setState((state) => ({
      ...state,
      timezone,
    }));
  };

  return {
    timezone: state.timezone,
    setTimezone,
  };
};
