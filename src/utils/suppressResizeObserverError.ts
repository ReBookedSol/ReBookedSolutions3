/**
 * Minimal ResizeObserver Error Suppression
 * Only suppresses known browser ResizeObserver loop limit errors
 */

function isBenignResizeObserverMessage(text: string): boolean {
  const msg = text.toLowerCase();
  return (
    msg.includes("resizeobserver") && (
      msg.includes("loop limit exceeded") ||
      msg.includes("loop completed") ||
      msg.includes("undelivered notifications")
    )
  );
}

// Also handle as a global error
window.addEventListener("error", (event) => {
  const message = (event.message || "").toLowerCase();
  if (isBenignResizeObserverMessage(message)) {
    event.preventDefault();
    return false as any;
  }
});

export {};
