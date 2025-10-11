import { Tab } from "@headlessui/react";

const SubTabsList = ({ titles }: { titles: string[] }) => {
  return (
    <Tab.List className="mb-5 flex gap-2 rounded-lg bg-sky-50/50 p-1 backdrop-blur-sm">
      {titles.map((title, index) => (
        <Tab
          key={index}
          className={({ selected }) =>
            `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
              selected
                ? "bg-white text-sky-900 shadow-sm"
                : "text-sky-700 hover:bg-white/60 hover:text-sky-900"
            }`
          }
        >
          {title}
        </Tab>
      ))}
    </Tab.List>
  );
};

export default SubTabsList;
