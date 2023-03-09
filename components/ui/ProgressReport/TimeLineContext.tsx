import { createContext, FC, useState } from "react";

interface TimelineContextProps {
  currentEventId: string;
  setEventId: (id: string) => void;
}

const TimeLineContext = createContext<Partial<TimelineContextProps>>({});

export const TimeLineContextProvider = ({ children }) => {
  const [currentEventId, setCurrentEventId] = useState<string>();

  const setEventId = (id: string) => {
    setCurrentEventId(id);
  };

  return (
    <TimeLineContext.Provider
      value={{ currentEventId: currentEventId, setEventId: setEventId }}
    >
      {children}
    </TimeLineContext.Provider>
  );
};

export default TimeLineContext;
