import {
  Checkbox as MaterialCheckBox,
  makeStyles,
  Theme,
} from "@material-ui/core/";
import clsx from "clsx";
import { useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { ChangeEvent } from "react";

const useStyles = makeStyles<Theme, { theme: string }>({
  root: {
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
  icon: {
    borderRadius: 3,
    width: 16,
    height: 16,
    backgroundColor: (props) => (props.theme === "dark" ? "black" : "white"),
  },
  checkedIcon: {
    backgroundImage:
      "linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))",
    "&:before": {
      display: "block",
      width: 16,
      height: 16,
      backgroundImage:
        "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
        " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
        "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%230001FE'  /%3E%3C/svg%3E\")",
      content: '""',
    },
  },
});

interface CheckboxProps {
  value: boolean;
  disabled?: boolean;
  onChange: (value: ChangeEvent<HTMLInputElement>) => void;
}

const Checkbox = observer(({ value, onChange, disabled }: CheckboxProps) => {
  const userStore = useUserStore();

  const classes = useStyles({ theme: userStore.theme });

  return (
    <MaterialCheckBox
      checked={value}
      value={value}
      disabled={disabled}
      onChange={onChange}
      disableRipple={true}
      disableFocusRipple={true}
      disableTouchRipple={true}
      checkedIcon={<span className={clsx(classes.icon, classes.checkedIcon)} />}
      icon={<span className={classes.icon} />}
      style={{ backgroundColor: "transparent" }}
    />
  );
});

export default Checkbox;
