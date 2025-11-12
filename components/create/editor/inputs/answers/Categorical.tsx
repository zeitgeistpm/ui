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
      // Extract index from id (format: "answer-0", "answer-1", etc.)
      const getIndexFromId = (id: string | number) => {
        if (typeof id === "string" && id.startsWith("answer-")) {
          return parseInt(id.replace("answer-", ""), 10);
        }
        return -1;
      };

      const oldIndex = getIndexFromId(active.id);
      const newIndex = getIndexFromId(over.id);

      if (oldIndex === -1 || newIndex === -1 || !value?.answers) return;

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

  // Check if this is Yes/No (disabled with 2 answers)
  const isYesNo = disabled && value?.answers?.length === 2;

  return (
    <div>
      <DndContext
        sensors={dragSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SortableContext
            items={value?.answers.map((_, index) => `answer-${index}`) ?? []}
            strategy={verticalListSortingStrategy}
            disabled={draggingDisabled}
          >
            {value?.answers.map((answer: string, index: number) => {
              return (
                <AnswerInput
                  key={`answer-${index}`}
                  id={`answer-${index}`}
                  disabled={disabled ?? false}
                  value={answer}
                  onChange={handleChange(index, onChange)}
                  onBlur={handleChange(index, onBlur)}
                  placeholder={`Answer ${index + 1}`}
                  onClear={handleClearClick(index)}
                  draggingDisabled={draggingDisabled || answer === ""}
                  isYesNo={isYesNo}
                />
              );
            })}
          </SortableContext>

          {!disabled && (
            <button
              type="button"
              className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20 active:scale-95"
              onClick={handleAddOptionClick}
            >
              + Add Option
            </button>
          )}
        </div>
      </DndContext>
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
  isYesNo,
}: {
  id: string;
  value: string;
  disabled: boolean;
  placeholder?: string;
  onChange: (answer: string) => void;
  onBlur: (answer: string) => void;
  onClear: () => void;
  draggingDisabled?: boolean;
  isYesNo?: boolean;
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

  // For Yes/No, show as compact chips
  if (isYesNo) {
    return (
      <div
        style={style}
        className="rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 shadow-sm backdrop-blur-sm"
      >
        {value}
      </div>
    );
  }

  return (
    <div
      style={style}
      className="group relative flex min-w-[140px] items-center rounded-lg bg-white/10 px-4 py-3 shadow-sm backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15"
    >
      <Input
        disabled={disabled}
        className="!m-0 h-full flex-1 bg-transparent !p-0 pr-16 text-sm text-white/90 outline-none placeholder:text-white/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {!disabled && (
        <div className="absolute right-8 top-[50%] z-10 flex translate-y-[-50%] gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            className="rounded-md border-2 border-ztg-red-500/60 bg-ztg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-ztg-red-400 transition-all hover:bg-ztg-red-500/30 active:scale-95"
            onClick={onClear}
            aria-label={value ? `Remove ${value}` : "Remove selection"}
          >
            ✕
          </button>
        </div>
      )}
      <div
        className={`absolute right-2 top-[50%] z-10 flex translate-y-[-50%] gap-2 text-white/90/60 transition-opacity duration-300 ${
          draggingDisabled && "cursor-not-allowed opacity-25"
        }`}
        ref={setNodeRef}
        {...attributes}
        {...listeners}
      >
        <MdOutlineDragIndicator size={16} />
      </div>
    </div>
  );
};

export default CategoricalAnswersInput;
