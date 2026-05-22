interface TransportBarProps {
  hasAnalysis: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TransportBar({ hasAnalysis, onPlay, onPause, onReset }: TransportBarProps) {
  return (
    <div className="transport">
      <button className="ghost-button" disabled={!hasAnalysis} onClick={onPlay} type="button">
        Play Segment
      </button>
      <button className="ghost-button" disabled={!hasAnalysis} onClick={onPause} type="button">
        Pause
      </button>
      <button className="ghost-button" disabled={!hasAnalysis} onClick={onReset} type="button">
        Reset
      </button>
    </div>
  );
}
