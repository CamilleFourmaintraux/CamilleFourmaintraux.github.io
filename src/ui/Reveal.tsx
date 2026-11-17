import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { useReveal } from "./motion";

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  index?: number;
  children: ReactNode;
};

export default function Reveal({
  as: Tag = "div",
  index,
  children,
  ...rest
}: Props) {
  const ref = useReveal<HTMLElement>(index);
  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
