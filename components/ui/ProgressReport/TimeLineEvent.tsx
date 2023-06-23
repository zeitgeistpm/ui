import { useContext, useEffect, useState } from "react";
import { ProgressBarEvent } from "./ProgressBar";
import TimeLineContext from "./TimeLineContext";

interface TimeLineEventProps extends ProgressBarEvent {
  id: string;
}

const TimeLineEvent = ({
  id,
  percentage,
  color,
  borderColor,
  hoverComponent,
}: TimeLineEventProps) => {
  const [hoveringEvent, setHoveringEvent] = useState<boolean>(false);
  const [hoveringEventDetails, setHoveringEventDetails] = useState<boolean>();
  const [showEventDetails, setShowEventDetails] = useState<boolean>();
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout>();
  const { currentEventId, setEventId } = useContext(TimeLineContext);

  useEffect(() => {
    if (hoveringEvent === false) {
      clearTimeout(timerRef);

      const ref = setTimeout(() => {
        if (!hoveringEventDetails) {
          setShowEventDetails(false);
        }
      }, 500);
      setTimerRef(ref);
    }
    return () => clearTimeout(timerRef);
  }, [hoveringEvent, hoveringEventDetails]);

  useEffect(() => {}, [showEventDetails]);

  const handleMouseEnterEvent = () => {
    clearTimeout(timerRef);
    setShowEventDetails(true);
    setHoveringEvent(true);
    setEventId && setEventId(id);
  };

  const handleMouseLeaveEvent = () => {
    setHoveringEvent(false);
  };

  const handleMouseEnterEventDetails = () => {
    setHoveringEventDetails(true);
  };

  const handleMouseLeaveEventDetails = () => {
    setHoveringEventDetails(false);
    setShowEventDetails(false);
  };
  return (
    <>
      <div
        onMouseEnter={handleMouseEnterEvent}
        onMouseLeave={handleMouseLeaveEvent}
        className="bg-white h-ztg-20 w-ztg-20 rounded-full "
        style={{
          backgroundColor: color,
          border: `2px solid ${borderColor}`,
        }}
      ></div>

      {showEventDetails === true && currentEventId === id ? (
        <div
          onMouseEnter={handleMouseEnterEventDetails}
          onMouseLeave={handleMouseLeaveEventDetails}
          className="text-white absolute bottom-ztg-25 z-20 right-0"
        >
          {hoverComponent}
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default TimeLineEvent;
