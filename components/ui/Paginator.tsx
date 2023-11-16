import { Plus } from "react-feather";

type PaginatorProps = {
  disabled?: boolean;
  onPlusClicked?: () => void;
};

const Paginator = ({
  disabled = false,
  onPlusClicked = () => {},
}: PaginatorProps) => {
  const handlePlusClicked = () => {
    onPlusClicked();
  };
  return (
    <div className="mt-ztg-40 flex w-full items-center justify-center">
      <div className="flex w-ztg-184 flex-col">
        <div className="flex h-ztg-24 flex-row items-center justify-center">
          <Plus
            onClick={() => {
              if (!disabled) {
                handlePlusClicked();
              }
            }}
            size={24}
            className={
              !disabled ? "cursor-pointer" : "cursor-default opacity-20"
            }
          />
        </div>
        <div className="flex h-ztg-38 flex-row justify-center">
          <div
            className={
              "flex h-full w-ztg-164 items-center justify-center text-ztg-12-150 font-medium " +
              (!disabled ? "cursor-pointer" : "cursor-default opacity-20")
            }
          >
            Load more
          </div>
        </div>
      </div>
    </div>
  );
};

export default Paginator;
