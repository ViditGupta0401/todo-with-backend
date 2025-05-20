declare module "../animation/AnimatedList/AnimatedList" {
  import * as React from "react";
  interface AnimatedListProps<T> {
    items: T[];
    itemKey: (item: T) => string;
    children: (item: T) => React.ReactNode;
    animateOnMount?: boolean;
    animateOnScroll?: boolean;
    className?: string;
    as?: React.ElementType;
  }
  export default function AnimatedList<T>(props: AnimatedListProps<T>): JSX.Element;
}
