import { Transition, motion } from "framer-motion";
import { useHover } from "lib/hooks/events/useHover";
import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

export type ActionableCardProps = {
  title: string;
  description: string;
  link: string;
  linkText: string;
  img: string;
  timeUsage: string;
  animationVariant?: "left" | "center" | "right";
};

const transitionConfig = {
  duration: 0.12,
  bounce: 10,
};

export const ActionableCard = ({
  title,
  description,
  link,
  linkText,
  img,
  timeUsage,
}: ActionableCardProps) => {
  const { hovered, register } = useHover();

  return (
    <Link href={link} className="flex flex-col">
      <motion.div
        initial={false}
        className="flex w-full flex-col rounded-md bg-white px-7 py-5"
        transition={transitionConfig}
        animate={{
          scale: hovered ? 1.02 : 1,
          translateY: hovered ? "-6px" : 0,

          boxShadow: hovered ? "-2px 2px 3px rgba(10,10,10, 0.07)" : "0",
        }}
        {...register()}
      >
        <div className="mb-6 flex-1">
          <motion.h6
            initial={false}
            transition={{
              duration: 0.12,
              bounce: 10,
            }}
            animate={{
              translateX: hovered ? "4px" : 0,
              translateY: hovered ? "-4px" : 0,
            }}
            className="mb-4 text-xl font-semibold"
          >
            {title}
          </motion.h6>
          <div className="flex gap-4">
            <motion.div
              initial={false}
              className="relative h-[84px] w-[84px] min-w-[84px] rounded-xl md:h-[52px] md:w-[52px] md:min-w-[52px] lg:h-[84px] lg:w-[84px] lg:min-w-[84px]"
              transition={transitionConfig}
              animate={{
                translateX: hovered ? "8px" : 0,
                translateY: hovered ? "-8px" : 0,
                boxShadow: hovered ? "-5px 5px 3px rgba(10,10,10, 0.3)" : "0",
              }}
            >
              <Image src={img} alt={title} fill />
            </motion.div>

            <motion.p
              initial={false}
              transition={transitionConfig}
              animate={{
                translateX: hovered ? "2px" : 0,
                translateY: hovered ? "-2px" : 0,
              }}
              className="text-ztg-14-150"
            >
              {description}
            </motion.p>
          </div>
        </div>
        <div className="flex gap-2 md:flex-col lg:flex-row">
          <motion.div
            initial={false}
            transition={transitionConfig}
            animate={{
              translateX: hovered ? "2px" : 0,
              translateY: hovered ? "-2px" : 0,
              scale: hovered ? 1.02 : 1,
            }}
            className="flex flex-1 items-center gap-1 text-blue-500"
          >
            {linkText}

            <FiChevronRight size={20} />
          </motion.div>
          <div>
            <motion.div
              initial={false}
              className={"inline-block rounded-md"}
              transition={transitionConfig}
              animate={{
                translateX: hovered ? "2px" : 0,
                translateY: hovered ? "-2px" : 0,
                scale: hovered ? 1.02 : 1,
                boxShadow: hovered ? "-2px 2px 4px rgba(10,10,10, 0.3)" : "0",
              }}
            >
              <div className="inline-block rounded-md bg-gray-200 px-2 py-1 text-xs lg:text-sm">
                {timeUsage}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
