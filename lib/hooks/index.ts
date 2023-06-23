import { useEffect, useMemo, useRef, useState } from "react";
import { fromEvent, Subscription } from "rxjs";
import { debounceTime } from "rxjs/operators";

export const useEvent = (
  target: EventTarget | undefined,
  eventName: string,
  debounceMs: number = 0,
) => {
  const eventSub = useRef<Subscription>(null);
  const [event, setEvent] = useState<Event>();

  useEffect(() => {
    if (eventSub.current) {
      eventSub.current.unsubscribe();
    }
    if (!target) {
      return;
    }
    eventSub.current = fromEvent(target, eventName)
      .pipe(debounceTime(debounceMs))
      .subscribe((e: Event) => setEvent(e));
    return () => eventSub.current.unsubscribe();
  }, [target]);

  return event;
};
