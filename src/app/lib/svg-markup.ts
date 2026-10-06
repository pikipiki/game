import { createElement, type ReactElement } from 'react';

/** Transforme le markup interne des icônes `ui.ts` en nœuds SVG React. */
export function reactSvgFromIconMarkup(markup: string): ReactElement[] {
  const nodes: ReactElement[] = [];
  let key = 0;

  const pathRe = /<path\s+d="([^"]+)"\s*\/>/g;
  let pathMatch = pathRe.exec(markup);
  while (pathMatch !== null) {
    nodes.push(createElement('path', { key, d: pathMatch[1] }));
    key += 1;
    pathMatch = pathRe.exec(markup);
  }

  const circleRe =
    /<circle\s+cx="([^"]+)"\s+cy="([^"]+)"\s+r="([^"]+)"\s*\/>/g;
  let circleMatch = circleRe.exec(markup);
  while (circleMatch !== null) {
    nodes.push(
      createElement('circle', {
        key,
        cx: circleMatch[1],
        cy: circleMatch[2],
        r: circleMatch[3],
      }),
    );
    key += 1;
    circleMatch = circleRe.exec(markup);
  }

  return nodes;
}
