import {
  useState,
  useRef,
  useLayoutEffect,
  ReactNode,
  CSSProperties,
  useMemo,
} from "react";
import {
  motion,
  useViewportScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { random } from "lodash";

type ParallaxProps = {
  children: ReactNode;
  offset?: number;
  className?: string;
  style?: CSSProperties;
};

const Parallax = ({
  children,
  className,
  style,
  offset = 28,
}: ParallaxProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const [elementTop, setElementTop] = useState(0);
  const ref = useRef(null);

  const { scrollY } = useViewportScroll();
  const initial = 0;
  const final = elementTop + offset;

  const mass = useMemo(() => random(3, 20), []);
  const stiffness = useMemo(() => random(310, 350), []);
  const damping = useMemo(() => random(50, 90), []);

  const yRange = useTransform(scrollY, [initial, final], [offset, -offset]);
  const y = useSpring(yRange, { stiffness, damping });

  useLayoutEffect(() => {
    const element = ref.current;
    const onResize = () => {
      setElementTop(
        element.getBoundingClientRect().top + window.scrollY ||
          window.pageYOffset,
      );
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [ref]);

  // Don't parallax if the user has "reduced motion" enabled
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} className={className} style={{ ...(style || {}), y }}>
      {children}
    </motion.div>
  );
};

export default Parallax;
