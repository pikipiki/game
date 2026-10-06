export interface OpponentStrikeBubbleViewProps {
  readonly message: string;
  readonly left: number;
  readonly top: number;
}

export function OpponentStrikeBubbleView({
  message,
  left,
  top,
}: OpponentStrikeBubbleViewProps) {
  return (
    <div
      aria-live="assertive"
      className="opponent-strike-bubble"
      data-testid="opponent-strike-bubble"
      role="status"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <span className="opponent-strike-bubble__text">{message}</span>
    </div>
  );
}
