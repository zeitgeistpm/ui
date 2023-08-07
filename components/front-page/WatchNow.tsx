import { Video } from "react-feather";

const WatchHow = () => {
  return (
    <div className="flex items-center w-full bg-white h-[80px] md:h-[120px] px-3 md:px-[41px] overflow-hidden relative">
      <div className="font-medium text-sm sm:text-lg md:text-[32px]  z-10">
        Trade on any future event
      </div>
      <div className="flex item-center justify-center gap-2 ml-auto bg-[#DC056C] text-white rounded-md px-[20px] py-[10px] z-10">
        <span className="text-sm md:text-[px]">Watch how</span>
        <Video size={24} />
      </div>

      <div
        className="rounded-full absolute flex items-center justify-center"
        style={{
          height: 625,
          width: 625,
          background:
            "linear-gradient(131deg, rgba(240, 206, 135, 0.05) 0%, rgba(50, 255, 157, 0.40) 100%)",
        }}
      >
        <div
          className="rounded-full "
          style={{
            height: 337,
            width: 337,
            background:
              "linear-gradient(131deg, rgba(240, 206, 135, 0.05) 0%, rgba(50, 255, 157, 0.40) 100%)",
          }}
        ></div>
      </div>
      <div
        className="rounded-full absolute right-[200px] -top-[80px] hidden lg:block"
        style={{
          height: 157,
          width: 157,
          background:
            "linear-gradient(131deg, rgba(240, 206, 135, 0.40) 0%, rgba(254, 0, 152, 0.40) 100%)",
        }}
      ></div>
    </div>
  );
};

export default WatchHow;
