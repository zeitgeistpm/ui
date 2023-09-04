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
        className="w-full rounded-md py-5 px-7 bg-white flex flex-col"
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
            className="font-semibold text-xl mb-4"
          >
            {title}
          </motion.h6>
          <div className="flex gap-4">
            <motion.div
              initial={false}
              className="relative min-w-[84px] min-h-[80px] rounded-xl"
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
        <div className="flex md:flex-col lg:flex-row gap-2">
          <motion.div
            initial={false}
            transition={transitionConfig}
            animate={{
              translateX: hovered ? "2px" : 0,
              translateY: hovered ? "-2px" : 0,
              scale: hovered ? 1.02 : 1,
            }}
            className="text-blue-500 flex items-center gap-1 flex-1"
          >
            {linkText}

            <FiChevronRight size={20} />
          </motion.div>
          <motion.div
            initial={false}
            className={"rounded-md"}
            transition={transitionConfig}
            animate={{
              translateX: hovered ? "2px" : 0,
              translateY: hovered ? "-2px" : 0,
              scale: hovered ? 1.02 : 1,
              boxShadow: hovered ? "-2px 2px 4px rgba(10,10,10, 0.3)" : "0",
            }}
          >
            <div className="inline-block text-sm bg-gray-200 rounded-md py-1 px-2">
              {timeUsage}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
};
