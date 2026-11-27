import { useEffect, useRef, useState } from "react";

const REVEAL_MS = 3000;

export function useTapToReveal(onActivate) {
  const [revealed, setRevealed] = useState(false);
  const pointerType = useRef("mouse");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerDown = (event) => {
    pointerType.current = event.pointerType;
  };

  const onClick = (event) => {
    const touch = pointerType.current === "touch";
    pointerType.current = "mouse";
    if (touch && !revealed) {
      setRevealed(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRevealed(false), REVEAL_MS);
      return;
    }
    clearTimeout(timer.current);
    setRevealed(false);
    onActivate(event);
  };

  return { revealed, onPointerDown, onClick };
}
