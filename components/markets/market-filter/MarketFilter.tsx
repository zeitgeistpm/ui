import { observer } from "mobx-react";
import ReactSelect from "react-select";

// import QuitIcon from "public/QuitIcon.png";

const MarketFilterContainer = observer(({ children }) => {
  return (
    <div className="w-full flex flex-col bg-black h-64 p-12">
      {children}
    </div>
  );
});


const Control = ({ children, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div className="flex px-ztg-16" onMouseDown={onMouseDown}>
      {children}
    </div>
  );
};

const SingleValue = (props) => {
  return <></>;
};

const IndicatorSeparator = () => {
  return <></>;
};

const DropDownSelect = observer(() => {
  return (
    <ReactSelect
      placeholder="Category"
      components={{
        Control,
        SingleValue,
        IndicatorSeparator,
      }}
    />
  )
});

const filterOptions = [
  { value: "newest", label: "Newest" },
  { value: "liquidity", label: "Liquidity" },
  { value: "volume", label: "Volume" },
]

const FilterSelect = observer(() => {
  return (
    <ReactSelect
      options={filterOptions}
      components={{
        IndicatorSeparator,
      }}
    />
  )
});

const MarketFilterOptions = observer(() => {
  return (
    <div className="w-full flex h-12 bg-green-300 justify-between">
      <DropDownSelect />
      <FilterSelect />
    </div>
  );
});

const ClearAllBtn = observer(() => {
  return (
    <button className="flex px-ztg-10 py-ztg-5 bg-white rounded-ztg-5 text-black text-ztg-14-150 border-gray-800 border">
      Clear All
    </button>
  )
});

const SelectedItem = observer(({ label }) => {
  return (
    <div className="flex px-ztg-10 py-ztg-5 rounded-ztg-5 bg-gray-400 text-gray-800 font-normal text-ztg-14-150 gap-ztg-5">
      {/* <img src="public/QuitIcon.png" /> */}
      <div className="w-ztg-8">X</div>
      {label}
    </div>
  )
});

const MarketFilterSelected = observer(() => {
  return (
    <div className="w-full flex h-ztg-32 bg-red-200">
      <ClearAllBtn />
      <SelectedItem label="Sports" />
      <SelectedItem label="eSports" />
    </div>
  );
});

const MarketFilter = observer(() => {
  return (
    <MarketFilterContainer>
      <MarketFilterOptions />
      <MarketFilterSelected />
    </MarketFilterContainer>
  );
});

export default MarketFilter;
