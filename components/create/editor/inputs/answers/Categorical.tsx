import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CategoricalAnswers,
  YesNoAnswers,
} from "lib/state/market-creation/types/form";
import { uniq } from "lodash-es";
import { MdOutlineDragIndicator } from "react-icons/md";
import { FormEvent } from "../../types";
import Input from "components/ui/Input";

export type CategoricalAnswersInputProps = {
  name: string;
  value?: CategoricalAnswers | YesNoAnswers;
  onChange?: (event: FormEvent<CategoricalAnswers>) => void;
  onBlur?: (event: FormEvent<CategoricalAnswers>) => void;
  disabled?: boolean;
};

export const CategoricalAnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
  disabled,
}: CategoricalAnswersInputProps) => {
  const dragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
  );

  const handleChange =
    (
      index: number,
      cb?:
        | CategoricalAnswersInputProps["onChange"]
        | CategoricalAnswersInputProps["onBlur"],
    ) =>
    (answer: string) => {
      cb?.({
        type: "change",
        target: {
          name,
          value: {
            type: "categorical",
            answers:
              value?.answers.map((v: string, i: number) =>
                i === index ? answer : v,
              ) ?? [],
          },
        },
      });
    };

  const handleAddOptionClick = () => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "categorical",
          answers: [...(value?.answers ?? []), ""] as string[],
        },
      },
    });
  };

  const handleClearClick = (index: number) => () => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "categorical",
          answers: (value?.answers.filter((_, i) => i !== index) ??
            []) as string[],
        },
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value?.answers.findIndex((v) => v === active.id);
      const newIndex = value?.answers.findIndex((v) => v === over.id);

      if (!oldIndex || !newIndex || !value?.answers) return;

      onChange?.({
        type: "change",
        target: {
          name,
          value: {
            type: "categorical",
            answers: arrayMove(value?.answers, oldIndex, newIndex) as string[],
          },
        },
      });
    }
  };

  const draggingDisabled =
    disabled ||
    !value?.answers ||
    value?.answers?.length < 2 ||
    uniq(value?.answers).length < value?.answers.length;

  return (
    <div>
      <div className="mb-2 items-center justify-center md:flex">
        <div className="flex-1 justify-center md:flex">
          <DndContext
            sensors={dragSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div>
              <SortableContext
                items={value?.answers as string[]}
                strategy={verticalListSortingStrategy}
                disabled={draggingDisabled}
              >
                {value?.answers.map((answer: string, index: number) => {
                  return (
                    <AnswerInput
                      key={index}
                      id={answer}
                      disabled={disabled ?? false}
                      value={answer}
                      onChange={handleChange(index, onChange)}
                      onBlur={handleChange(index, onBlur)}
                      placeholder={`Answer ${index + 1}`}
                      onClear={handleClearClick(index)}
                      draggingDisabled={draggingDisabled || answer === ""}
                    />
                  );
                })}
              </SortableContext>
            </div>
          </DndContext>
        </div>
      </div>

      {!disabled && (
        <div className="center mb-4 flex">
          <button
            type="button"
            className="rounded-full border-2 border-gray-300 px-8 py-4 text-sm transition-all active:scale-95"
            onClick={handleAddOptionClick}
          >
            Add Option
          </button>
        </div>
      )}
    </div>
  );
};

const AnswerInput = ({
  id,
  value,
  disabled,
  placeholder,
  onChange,
  onBlur,
  onClear,
  draggingDisabled,
}: {
  id: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  onChange: (answer: string) => void;
  onBlur: (answer: string) => void;
  onClear: () => void;
  draggingDisabled?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id,
      disabled: disabled || draggingDisabled,
      animateLayoutChanges: () => {
        return false;
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      style={style}
      className={`relative mb-3 w-full flex-1 rounded-md bg-gray-100 px-5 py-3 md:min-w-[520px] md:max-w-[420px]`}
    >
      <Input
        disabled={disabled}
        className={`!m-0 h-full w-full bg-transparent !p-0 outline-none`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {!disabled && (
        <div className="absolute right-8 top-[50%] z-10 flex translate-y-[-50%] gap-2">
          <button
            type="button"
            className=" rounded-md bg-white px-2 py-1"
            onClick={onClear}
          >
            remove
          </button>
        </div>
      )}
      <div
        className={`absolute right-2 top-[50%] z-10 flex translate-y-[-50%] gap-2 transition-opacity duration-300 ${
          draggingDisabled && "cursor-not-allowed opacity-25"
        }`}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        <MdOutlineDragIndicator />
      </div>
    </div>
  );
};

export default CategoricalAnswersInput;
