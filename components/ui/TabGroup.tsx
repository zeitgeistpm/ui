import { Tab } from "@headlessui/react";
import React from "react";

export type TabGroupProps<T extends readonly string[]> = {
  items: T;
  labels?: Record<T[number], string>;
  icons?: Record<T[number], React.FC>;
  disabled?: T[number][];
  onChange: (item: T[number]) => void;
  selected: T[number] | undefined;
  selectedItemClassName?: string;
  disabledItemClassName?: string;
  itemClassName?: string;
  className?: string;
};

const TabGroup = <T extends readonly string[]>({
  items,
  labels,
  icons,
  selected,
  disabled = [],
  onChange,
  selectedItemClassName = "",
  disabledItemClassName = "",
  itemClassName = "h-full outline-none flex",
  className = "",
}: TabGroupProps<T>) => {
  const selectedIndex = selected != null ? items.indexOf(selected) : -1;

  return (
    <Tab.Group
      manual
      onChange={(index) => {
        if (disabled.includes(items[index])) {
          return;
        }
        onChange(items[index]);
      }}
      defaultIndex={selectedIndex}
      selectedIndex={selectedIndex}
    >
      <Tab.List
        className={"grid gap-3 " + `grid-cols-${items.length} ` + className}
      >
        {items.map((item, id) => {
          const Icon = icons ? icons[item] : null;
          const isDisabled = disabled.includes(item);
          return (
            <Tab
              key={id}
              as="div"
              className={
                itemClassName +
                " " +
                (selectedIndex === id
                  ? selectedItemClassName
                  : isDisabled
                    ? disabledItemClassName
                    : "cursor-pointer")
              }
            >
              {Icon && (
                <div className="relative h-[40px] w-[40px]">
                  <Icon fill={isDisabled ? "#C3C9CD" : undefined} />
                </div>
              )}
              {labels ? labels[item] : item}
            </Tab>
          );
        })}
      </Tab.List>
    </Tab.Group>
  );
};

export default TabGroup;
