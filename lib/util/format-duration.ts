import moment from "moment";

export const formatDuration = (duration: moment.Duration) => {
  const format =
    duration.asYears() > 1
      ? "year"
      : duration.asMonths() > 1
      ? "month"
      : duration.asWeeks() > 1
      ? "week"
      : duration.asDays() > 1
      ? "day"
      : duration.asHours() > 1
      ? "hour"
      : duration.asMinutes() > 1
      ? "minute"
      : duration.asSeconds() > 1
      ? "second"
      : "hour";
  const value = duration.as(format);
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} ${format}${
    value > 1 ? "s" : ""
  }`;
};
