import { useRef } from 'react';

interface EmbeddedGameProps {
  title: string;
  src: string;
}

/**
 * Full-height frame for a standalone game page that runs its own levels and controls.
 * The frame takes keyboard focus once loaded so arrow keys reach the game straight away.
 */
export default function EmbeddedGame({ title, src }: EmbeddedGameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  return (
    <iframe
      ref={frameRef}
      title={title}
      src={src}
      className="flex-1 w-full min-h-0 border-0 bg-slate-950"
      allow="autoplay; fullscreen; gamepad"
      onLoad={() => frameRef.current?.focus()}
    />
  );
}
