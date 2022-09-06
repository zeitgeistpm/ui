import { Slider as MaterialSlider } from "@material-ui/core/";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

interface SliderProps {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

const shadow =
  "0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.02)";

const marks = [
  {
    value: 25,
  },
  {
    value: 50,
  },
  {
    value: 75,
  },
  {
    value: 100,
  },
];

const useStyles = makeStyles<Theme, { theme: string }>({
  root: {
    color: "#0001FE",
    height: 2,
    padding: "15px 0",
  },
  thumb: {
    border: "3px solid #748296",
    height: 17,
    width: 17,
    backgroundColor: (props) => (props.theme === "dark" ? "black" : "white"),
    boxShadow: shadow,
    marginTop: -6,
    "&:focus, &:hover, &$active": {
      boxShadow:
        "0 3px 1px rgba(0,0,0,0.1),0 4px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(0,0,0,0.02)",
      "@media (hover: none)": {
        boxShadow: shadow,
      },
    },
  },
  active: {},
  valueLabel: {
    fontFamily: "Roboto Mono",
    fontWeight: 700,
    fontSize: "10px",
    left: "calc(-50% - 3px)",
    top: -17,
    "& *": {
      background: "transparent",
      color: (props) => (props.theme === "dark" ? "#DEE6EB" : "black"),
    },
  },
  track: {
    height: 3,
  },
  rail: {
    height: 3,
    backgroundColor: (props) => (props.theme === "dark" ? "#2A384D" : "D3DFEB"),
  },
  mark: {
    backgroundColor: "#748296",
    height: 3,
    width: 3,
    marginTop: 0,
  },
  markActive: {
    opacity: 1,
    backgroundColor: "currentColor",
  },
});

const Slider = observer(
  ({ value, onChange, disabled = false }: SliderProps) => {
    const userStore = useUserStore();
    const [sliderValue, setSliderValue] = useState<number>(() => value);
    const classes = useStyles({ theme: userStore.theme });

    const formatLabel = (value) => value + "%";

    useEffect(() => {
      setSliderValue(value);
    }, [value]);

    const handleSliderChange = (event, newValue: number) => {
      if (disabled) {
        return;
      }
      setSliderValue(newValue);
      onChange(newValue);
    };

    return (
      <MaterialSlider
        aria-label="Slider"
        marks={marks}
        valueLabelDisplay="on"
        valueLabelFormat={formatLabel}
        value={sliderValue}
        onChange={handleSliderChange}
        disabled={disabled}
        classes={classes}
      />
    );
  },
);

export default Slider;
