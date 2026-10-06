import { WebglErrorView } from '@/app/components/feedback/WebglErrorView';
import type { WebglErrorCopy } from '@/app/lib/game-copy';

export interface SceneWebglOverlayProps {
  readonly visible: boolean;
  readonly copy: WebglErrorCopy;
}

export function SceneWebglOverlay({
  visible,
  copy,
}: SceneWebglOverlayProps) {
  if (!visible) return null;
  return (
    <WebglErrorView body={copy.body} title={copy.title} />
  );
}
