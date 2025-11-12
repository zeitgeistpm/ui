import { Tab } from "@headlessui/react";

const PrimaryTabsList = ({ titles }: { titles: string[] }) => {
  return (
    <Tab.List className="mb-3 flex gap-2 overflow-auto rounded-lg bg-white/10 p-1.5 shadow-sm backdrop-blur-md">
      {titles.map((title, index) => (
        <Tab
          key={index}
          className={({ selected }) =>
            `whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none sm:px-6 sm:text-base ${
              selected
                ? "bg-ztg-green-600/80 text-white/90 shadow-md"
                : "text-white/70 hover:bg-white/20 hover:text-white/90"
            }`
          }
        >
          {title}
        </Tab>
      ))}
    </Tab.List>
  );
};

export default PrimaryTabsList;
