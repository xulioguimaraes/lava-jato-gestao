import { useEffect, useState } from "react";

type Props = {
  value: number;
  prefix?: string;
  isCurrency?: boolean;
  duration?: number;
};

export function AnimatedCounter({
  value,
  prefix = "",
  isCurrency = false,
  duration = 800,
}: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = isCurrency
    ? display.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(display).toString();

  return (
    <>
      {prefix}
      {formatted}
    </>
  );
}
