import { observer } from "mobx-react";
import { useState } from "react";
import { ChevronDown } from "react-feather";
import ReactSelect from "react-select";

// import QuitIcon from "public/QuitIcon.png";

const MarketFilterContainer = observer(({ children }) => {
  return (
    <div className="w-full flex flex-col bg-black">
      {children}
    </div>
  );
});


const Control = ({ children, label, ...rest }) => {
  const { innerProps } = rest;
  const { onMouseDown } = innerProps;
  return (
    <div
      className="flex justify-center items-center pl-ztg-20 font-lato font-medium text-ztg-16-150 text-sky-600 h-ztg-44"
      onMouseDown={onMouseDown}
    >
      {label}
      <ChevronDown
        size={18}
        className="text-sky-600 ml-ztg-8 font-bold"
      />
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

const DropdownIndicator = () => {
  return <></>;
};

const Placeholder = () => {
  return <></>;
};

const customStyles = {
  menu: (provided) => {
    return {
      ...provided,
      backgroundColor: "black",
    }
  }
}

const DropDownSelect = observer(({ label, options, add }) => {
  return (
    <ReactSelect
      options={options}
      styles={customStyles}
      isMulti={false}
      isSearchable={false}
      onChange={(val: any) => {
        const { value, label } = val;
        add(value);
      }}
      components={{
        Control: ({ children, ...rest }) => (
          <Control label={label} {...rest}>
            {children}
          </Control>
        ),
        SingleValue,
        IndicatorSeparator,
        DropdownIndicator,
        Placeholder,
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

const MarketFilterOptions = observer(({ add }) => {
  return (
    <div className="w-full flex justify-end items-center gap-ztg-5 bg-blue-200">
      <DropDownSelect label="Category" options={categoryOptions} add={add} />
      <DropDownSelect label="Currency" options={currencyOptions} add={add} />
      <DropDownSelect label="Status" options={statusOptions} add={add} />
      <FilterSelect />
    </div>
  );
});

const ClearAllBtn = observer(({ clear }) => {
  return (
    <button
      className="flex px-ztg-10 py-ztg-5 bg-white rounded-ztg-5 text-black text-ztg-14-150 border-gray-800 border"
      onClick={clear}
    >
      Clear All
    </button>
  )
});

const SelectedItem = observer(({ label, remove }) => {
  return (
    <div className="flex px-ztg-10 py-ztg-5 rounded-ztg-5 bg-gray-400 text-gray-800 font-normal text-ztg-14-150 gap-ztg-5">
      {/* <img src="public/QuitIcon.png" /> */}
      <button
        className="w-ztg-8"
        onClick={() => remove(label)}
      >
        X
      </button>
      {label}
    </div>
  )
});

const MarketFilterSelected = observer(({ activeFilters, clear, remove }) => {
  return (
    <div className="w-full flex bg-red-200">
      {!!activeFilters.length && <ClearAllBtn clear={clear} />}
      {activeFilters.map((af) => <SelectedItem label={af} remove={remove} />)}
    </div>
  );
});

const MarketFilter = observer(() => {
  const [activeFilters, setActiveFilters] = useState(["Sports", "eSports"]);

  // Filter controllers
  const add = (item) => {
    const currentFilters = activeFilters;
    // checks that item doesn't already exist
    if (currentFilters.indexOf(item) !== -1) return;

    const nextFilters = [...currentFilters, item];
    setActiveFilters(nextFilters);
  };
  const clear = () => setActiveFilters([]);
  const remove = (item) => {
    const currentFilters = activeFilters;
    const idx = currentFilters.findIndex((i) => i === item);
    const nextFilters = [...currentFilters.slice(0, idx), ...currentFilters.slice(idx + 1, currentFilters.length)];
    setActiveFilters(nextFilters);
  }

  return (
    <MarketFilterContainer>
      <MarketFilterOptions
        add={add}
      />
      <MarketFilterSelected
        activeFilters={activeFilters}
        clear={clear}
        remove={remove}
      />
    </MarketFilterContainer>
  );
});

export default MarketFilter;
