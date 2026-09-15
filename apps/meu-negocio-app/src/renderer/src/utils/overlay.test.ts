import { describe, expect, it } from 'vitest';
import { type Box, resolveOverlayPosition } from './overlay';

const viewport = { width: 1000, height: 600 };
const bubble: Box = { width: 120, height: 30 };

function anchor(left: number, top: number, width = 40, height = 20) {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

describe('resolveOverlayPosition', () => {
  it('centers the layer above the anchor with a gap', () => {
    const position = resolveOverlayPosition(anchor(400, 300), bubble, viewport, 'above');
    expect(position).toEqual({ left: 400 + 20 - 60, top: 300 - 30 - 6 });
  });

  it('flips below the anchor when there is no room above', () => {
    const position = resolveOverlayPosition(anchor(400, 10), bubble, viewport, 'above');
    expect(position.top).toBe(10 + 20 + 6);
  });

  it('places the layer to the right of the anchor, vertically centered', () => {
    const position = resolveOverlayPosition(anchor(12, 300, 40, 36), bubble, viewport, 'right');
    expect(position).toEqual({ left: 12 + 40 + 6, top: 300 + 18 - 15 });
  });

  it('flips to the left of the anchor when there is no room on the right', () => {
    const position = resolveOverlayPosition(anchor(900, 300, 40, 36), bubble, viewport, 'right');
    expect(position.left).toBe(900 - 120 - 6);
  });

  it('places the layer below the anchor, aligned to its right edge', () => {
    const position = resolveOverlayPosition(anchor(400, 300), bubble, viewport, 'below-end');
    expect(position).toEqual({ left: 400 + 40 - 120, top: 300 + 20 + 6 });
  });

  it('flips above the anchor when there is no room below', () => {
    const position = resolveOverlayPosition(anchor(400, 580), bubble, viewport, 'below-end');
    expect(position.top).toBe(580 - 30 - 6);
  });

  it('keeps the layer inside the viewport with an edge margin', () => {
    const nearLeft = resolveOverlayPosition(anchor(0, 300), bubble, viewport, 'above');
    expect(nearLeft.left).toBe(8);
    const nearRight = resolveOverlayPosition(anchor(990, 300), bubble, viewport, 'above');
    expect(nearRight.left).toBe(1000 - 120 - 8);
    const nearBottom = resolveOverlayPosition(anchor(400, 590, 40, 20), bubble, viewport, 'right');
    expect(nearBottom.top).toBe(600 - 30 - 8);
  });
});
