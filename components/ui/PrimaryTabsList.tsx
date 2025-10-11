import { Tab } from "@headlessui/react";

const PrimaryTabsList = ({ titles }: { titles: string[] }) => {
  return (
    <Tab.List className="mb-3 flex gap-2 overflow-auto rounded-lg border border-sky-200/30 bg-white/60 p-1.5 shadow-sm backdrop-blur-md">
      {titles.map((title, index) => (
        <Tab
          key={index}
          className={({ selected }) =>
            `whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none sm:px-6 sm:text-base ${
              selected
                ? "bg-gradient-to-br from-sky-600 to-sky-700 text-white shadow-md"
                : "text-sky-700 hover:bg-sky-50/80 hover:text-sky-900"
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
