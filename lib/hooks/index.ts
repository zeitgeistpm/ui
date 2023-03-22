import { useEffect, useMemo, useRef, useState } from "react";
import Form from "mobx-react-form";
import { fromEvent, Observable, Subscription } from "rxjs";
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

export const useFormField = (form: Form, name: string, value: any) => {
  let formField: any;

  try {
    formField = form.$(name);
  } catch {
    formField = null;
  }

  const { invalid, message } = useMemo(() => {
    if (formField == null || formField.showError === false) {
      return { invalid: false };
    }
    const message = formField.error;
    const invalid = !formField.isValid;
    return { invalid, message };
  }, [formField, formField?.showError, formField?.error]);

  useEffect(() => {
    if (value == null) {
      value = "";
    }
    formField?.onChange && formField.onChange(value);
  }, [value]);

  return {
    formField,
    invalid,
    message,
  };
};
