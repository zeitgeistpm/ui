import { observer } from "mobx-react";
import { useState } from "react";
import ReactSelect from "react-select";

// import QuitIcon from "public/QuitIcon.png";

const MarketFilterContainer = observer(({ children }) => {
  return (
    <div className="w-full flex flex-col bg-black">
      {children}
    </div>
  );
});


const Control = ({ children, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div
      className="flex font-lato font-medium text-ztg-16-150 text-sky-600 h-ztg-44 bg-blue-600"
      onMouseDown={onMouseDown}
    >
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

const DropDownSelect = observer(({ label, options }) => {
  return (
    <ReactSelect
      placeholder={label}
      options={options}
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

const categoryOptions = [
  { value: "sports", label: "Sports" },
  { value: "politics", label: "Politics" },
  { value: "esports", label: "eSports" },
];

const currencyOptions = [
  { value: "ztg", label: "ZTG" },
  { value: "usd", label: "USD" },
];

const statusOptions = [
  { value: "proposed", label: "Proposed" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "reported", label: "Reported" },
  { value: "disputed", label: "Disputed" },
  { value: "resolved", label: "Resolved" },
]

const MarketFilterOptions = observer(({ add, remove }) => {
  return (
    <div className="w-full flex justify-end items-center gap-ztg-5 bg-blue-200">
      <DropDownSelect label="Category" options={categoryOptions} />
      <DropDownSelect label="Currency" options={currencyOptions} />
      <DropDownSelect label="Status" options={statusOptions} />
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

const MarketFilterSelected = observer(({ activeFilters, clear }) => {
  return (
    <div className="w-full flex h-ztg-32 bg-red-200">
      <ClearAllBtn />
      {activeFilters.map((af) => <SelectedItem label={af} />)}
    </div>
  );
});

const MarketFilter = observer(() => {
  const [activeFilters, setActiveFilters] = useState(["Sports", "eSports"]);

  // Filter controllers
  const add = (item) => {
    const currentFilters = activeFilters;
    const nextFilters = [...currentFilters, item];
    setActiveFilters(nextFilters);
  };
  const clear = () => setActiveFilters([]);
  const remove = (item) => {
    const currentFilters = activeFilters;
    const idx = currentFilters.findIndex(item);
    const nextFilters = [...currentFilters.slice(0, idx), ...currentFilters.slice(idx + 1, currentFilters.length)];
    setActiveFilters(nextFilters);
  }

  return (
    <MarketFilterContainer>
      <MarketFilterOptions
        add={add}
        remove={remove}
      />
      <MarketFilterSelected
        activeFilters={activeFilters}
        clear={clear}
      />
    </MarketFilterContainer>
  );
});

export default MarketFilter;
