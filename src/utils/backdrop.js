export const backdropClose = (onClose) => ({
  onMouseDown: (e) => {
    e.currentTarget.dataset.pressedOnBackdrop = e.target === e.currentTarget ? "true" : "false";
  },
  onClick: (e) => {
    const startedOnBackdrop = e.currentTarget.dataset.pressedOnBackdrop === "true";
    e.currentTarget.dataset.pressedOnBackdrop = "false";
    if (startedOnBackdrop && e.target === e.currentTarget) onClose(e);
  },
});
