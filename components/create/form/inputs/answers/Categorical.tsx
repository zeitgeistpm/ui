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

export type CategoricalAnswersInputProps = {
  name?: string;
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
              value?.answers.map((v, i) => (i === index ? answer : v)) ?? [],
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

    if (active.id !== over.id) {
      const oldIndex = value?.answers.findIndex((v) => v === active.id);
      const newIndex = value?.answers.findIndex((v) => v === over.id);

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
    value?.answers.length < 2 ||
    uniq(value?.answers).length < value?.answers.length;

  return (
    <div>
      <div className="mb-2 md:flex justify-center items-center">
        <div className="flex-1 md:flex justify-center">
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
                      disabled={disabled}
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
        <div className="flex center mb-4">
          <button
            type="button"
            className="border-gray-300 text-sm border-2 rounded-full py-4 px-8 transition-all false"
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
      className={`relative flex-1 w-full bg-gray-100 rounded-md md:min-w-[520px] md:max-w-[420px] py-3 px-5 mb-3`}
    >
      <input
        disabled={disabled}
        className={`h-full w-full bg-transparent outline-none`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {!disabled && (
        <div className="absolute flex gap-2 z-10 right-8 top-[50%] translate-y-[-50%]">
          <button
            type="button"
            className=" bg-white rounded-md py-1 px-2"
            onClick={onClear}
          >
            remove
          </button>
        </div>
      )}
      <div
        className={`absolute flex gap-2 z-10 right-2 top-[50%] translate-y-[-50%] transition-opacity duration-300 ${
          draggingDisabled && "opacity-25 cursor-not-allowed"
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
