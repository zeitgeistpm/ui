const PercentageChange = ({ change }: { change: string }) => {
  return (
    <div className="flex items-center">
      {Number(change) > 0 ? (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 0L9.33013 7.5H0.669873L5 0Z" fill="#70C703" />
        </svg>
      ) : (
        <></>
      )}

      {Number(change) < 0 ? (
        <svg
          className="rotate-180"
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 0L9.33013 7.5H0.669873L5 0Z" fill="#FF0054" />
        </svg>
      ) : (
        <></>
      )}

      <span className="ml-ztg-4 text-center font-mono text-ztg-14-150 dark:text-white/90">
        {change}%
      </span>
    </div>
  );
};

export default PercentageChange;
