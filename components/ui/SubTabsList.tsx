import { Tab } from "@headlessui/react";

const SubTabsList = ({ titles }: { titles: string[] }) => {
  return (
    <Tab.List className="mb-5 flex gap-2 rounded-lg bg-white/10 p-1 backdrop-blur-md">
      {titles.map((title, index) => (
        <Tab
          key={index}
          className={({ selected }) =>
            `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
              selected
                ? "bg-ztg-green-600/80 text-white shadow-sm"
                : "text-white/70 hover:bg-white/20 hover:text-white"
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
