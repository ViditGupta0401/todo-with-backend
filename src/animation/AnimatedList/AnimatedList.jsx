import React from 'react';

export default function AnimatedList({
  items,
  itemKey,
  children,
  animateOnMount = false,
  animateOnScroll = false,
  className = '',
  as: Component = 'div',
}) {
  // Simplified version without animations
  return (
    <div className={className}>
      {items.map((item) => (
        <div key={itemKey(item)}>
          {children(item)}
        </div>
      ))}
    </div>
  );
}
