// Pure fluid simulation splatting functions extracted from Canvas.jsx animation loop.
// Each function takes its dependencies as parameters — no React coupling.

import type { Node, EmitterNode, WindTunnelNode, VortexNode, ObstacleNode, RGBColor } from '../types/nodes';
import type { FluidSolver } from './fluidSolver';

interface ScreenPos {
  x: number;
  y: number;
}

type ToScreenFn = (cx: number, cy: number) => ScreenPos;

interface MouseState {
  x: number;
  y: number;
  px: number;
  py: number;
  isDown: boolean;
  isMoving: boolean;
}

interface BorderPoint {
  px: number;
  py: number;
  vx: number;
  vy: number;
}

/**
 * Draw white obstacle shapes onto the 2D offscreen canvas mask.
 * Called every frame to build the obstacle mask for the fluid solver.
 */
export function drawObstacleMask(
  nodes: Node[],
  obstacleCanvas: HTMLCanvasElement,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  zoom: number
): void {
  const ctx = obstacleCanvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, obstacleCanvas.width, obstacleCanvas.height);

  ctx.fillStyle = '#ffffff';

  nodes.forEach(node => {
    if (node.type === 'obstacle' && (node as ObstacleNode).collider === true) {
      const obstacleNode = node as ObstacleNode;
      const erode = obstacleNode.dissolveLevel || 0;
      if (erode >= 0.99) return;

      const screenPos = toScreen(node.x, node.y);
      const screenW = obstacleNode.width * zoom;
      const screenH = obstacleNode.height * zoom;

      const scaleX = obstacleCanvas.width / glCanvas.width;
      const scaleY = obstacleCanvas.height / glCanvas.height;

      const ox = screenPos.x * scaleX;
      const oy = screenPos.y * scaleY;
      const ow = screenW * scaleX;
      const oh = screenH * scaleY;
      const r = (obstacleNode.borderRadius || 12) * zoom * scaleX * (1 - erode);

      if (ow > 0 && oh > 0) {
        ctx.beginPath();
        ctx.roundRect(ox, oy, ow, oh, Math.max(0, r));
        ctx.fill();
      }
    }
  });
}

/**
 * Splat a standalone emitter node (velocity + dye).
 * Handles emitterMode: 'pulse' and 'sweep' internally.
 */
export function splatEmitter(
  solver: FluidSolver,
  node: EmitterNode,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  aspect: number
): void {
  const nowSec = Date.now() / 1000;
  let activeAngle = node.angle || 0;
  let multiplier = 1.0;

  if (node.emitterMode === 'pulse') {
    multiplier = Math.max(0.0, Math.sin(nowSec * 2 * Math.PI * (node.emitterPulseFreq || 2.0)));
  } else if (node.emitterMode === 'sweep') {
    activeAngle = (node.angle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
  }

  if (multiplier > 0.01) {
    const angleRad = (activeAngle * Math.PI) / 180;
    const forceStrength = (node.speed || 50) * 0.003 * multiplier;
    const vx = Math.cos(angleRad) * forceStrength;
    const vy = Math.sin(angleRad) * forceStrength;
    const rad = node.radius || 0.015;

    const sPos = toScreen(node.x, node.y);
    const normX = sPos.x / glCanvas.width;
    const normY = 1.0 - (sPos.y / glCanvas.height);

    solver.splat(solver.velocity, normX, normY, [vx, vy, 0], rad, aspect);
    const col: RGBColor = node.color || [1, 0, 1];
    const density = node.emitterDensity !== undefined ? node.emitterDensity : 1.0;
    const scaledCol = col.map((c: number) => c * 0.05 * multiplier * density);
    solver.splat(solver.dye, normX, normY, scaledCol, rad, aspect);
  }
}

/**
 * Splat a wind tunnel node (velocity only, no dye).
 * Injects velocity at 3 evenly-spaced points along the tunnel axis.
 */
export function splatWindTunnel(
  solver: FluidSolver,
  node: WindTunnelNode,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  aspect: number
): void {
  const w = node.width;
  const h = node.height;
  const angleRad = (node.angle * Math.PI) / 180;
  const forceStrength = (node.speed || 50) * 0.0015;
  const vx = Math.cos(angleRad) * forceStrength;
  const vy = Math.sin(angleRad) * forceStrength;

  const steps = 3;
  for (let i = 0; i < steps; i++) {
    const fraction = (i + 0.5) / steps - 0.5;
    const offsetCX = node.x + w / 2 + Math.cos(angleRad) * (w * fraction);
    const offsetCY = node.y + h / 2 + Math.sin(angleRad) * (h * fraction);

    const sPoint = toScreen(offsetCX, offsetCY);
    const nX = sPoint.x / glCanvas.width;
    const nY = 1.0 - (sPoint.y / glCanvas.height);

    if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
      solver.splat(solver.velocity, nX, nY, [vx, vy, 0], 0.03, aspect);
    }
  }
}

/**
 * Splat a vortex node (tangential velocity at 6 points on a ring).
 */
export function splatVortex(
  solver: FluidSolver,
  node: VortexNode,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  aspect: number
): void {
  const numPoints = 6;
  const str = (node.strength || 30) * 0.002;
  const r = node.radius || 80;

  for (let i = 0; i < numPoints; i++) {
    const theta = (i / numPoints) * Math.PI * 2;
    const px = node.x + Math.cos(theta) * r;
    const py = node.y + Math.sin(theta) * r;

    const sPoint = toScreen(px, py);
    const nX = sPoint.x / glCanvas.width;
    const nY = 1.0 - (sPoint.y / glCanvas.height);

    const vx = -Math.sin(theta) * str;
    const vy = Math.cos(theta) * str;

    if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
      solver.splat(solver.velocity, nX, nY, [vx, vy, 0], 0.015, aspect);
    }
  }
}

/**
 * Splat a burner obstacle (upward velocity + heat color at top edge).
 */
export function splatBurner(
  solver: FluidSolver,
  node: ObstacleNode,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  aspect: number
): void {
  const bx = node.x + node.width / 2;
  const by = node.y;
  const sPoint = toScreen(bx, by);
  const nX = sPoint.x / glCanvas.width;
  const nY = 1.0 - (sPoint.y / glCanvas.height);

  const heatForce = 0.05;
  solver.splat(solver.velocity, nX, nY, [0, heatForce, 0], 0.04, aspect);
  solver.splat(solver.dye, nX, nY, [0.04, 0.004, 0.016], 0.03, aspect);
}

/**
 * Splat a card emitter attached to an obstacle.
 * Handles emitterLocation: 'center', 'top', 'bottom', 'left', 'right', 'outline'.
 * Handles emitterMode: 'pulse' and 'sweep'.
 */
export function splatCardEmitter(
  solver: FluidSolver,
  node: ObstacleNode,
  glCanvas: HTMLCanvasElement,
  toScreen: ToScreenFn,
  aspect: number
): void {
  const nowSec = Date.now() / 1000;
  let multiplier = 1.0;
  let activeAngle = node.emitterAngle || 0;

  if (node.emitterMode === 'pulse') {
    multiplier = Math.max(0.0, Math.sin(nowSec * 2 * Math.PI * (node.emitterPulseFreq || 2.0)));
  } else if (node.emitterMode === 'sweep') {
    activeAngle = (node.emitterAngle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
  }

  const density = node.emitterDensity !== undefined ? node.emitterDensity : 1.0;
  const rad = node.emitterRadius || 0.02;
  const forceStrength = (node.emitterSpeed || 50) * 0.003 * multiplier;
  const col: RGBColor = node.emitterColor || [0.0, 0.94, 1.0];
  const scaledCol = col.map((c: number) => c * 0.05 * multiplier * density);

  const loc = node.emitterLocation || 'center';

  if (multiplier > 0.01) {
    if (loc === 'center') {
      const bx = node.x + node.width / 2;
      const by = node.y + node.height / 2;
      const sPoint = toScreen(bx, by);
      const nX = sPoint.x / glCanvas.width;
      const nY = 1.0 - (sPoint.y / glCanvas.height);

      const angleRad = (activeAngle * Math.PI) / 180;
      const vx = Math.cos(angleRad) * forceStrength;
      const vy = Math.sin(angleRad) * forceStrength;

      solver.splat(solver.velocity, nX, nY, [vx, vy, 0], rad, aspect);
      solver.splat(solver.dye, nX, nY, scaledCol, rad, aspect);
    } else {
      const points: BorderPoint[] = [];
      const x0 = node.x;
      const x1 = node.x + node.width;
      const y0 = node.y;
      const y1 = node.y + node.height;
      const numPoints = 5;

      const addBorderPoints = (borderSide: string) => {
        for (let i = 0; i < numPoints; i++) {
          const t = (i + 0.5) / numPoints;
          let px: number, py: number, vx: number, vy: number;
          if (borderSide === 'top') {
            px = x0 + t * (x1 - x0);
            py = y0;
            vx = 0;
            vy = forceStrength;
          } else if (borderSide === 'bottom') {
            px = x0 + t * (x1 - x0);
            py = y1;
            vx = 0;
            vy = -forceStrength;
          } else if (borderSide === 'left') {
            px = x0;
            py = y0 + t * (y1 - y0);
            vx = -forceStrength;
            vy = 0;
          } else {
            px = x1;
            py = y0 + t * (y1 - y0);
            vx = forceStrength;
            vy = 0;
          }
          points.push({ px, py, vx, vy });
        }
      };

      if (loc === 'top') {
        addBorderPoints('top');
      } else if (loc === 'bottom') {
        addBorderPoints('bottom');
      } else if (loc === 'left') {
        addBorderPoints('left');
      } else if (loc === 'right') {
        addBorderPoints('right');
      } else if (loc === 'outline') {
        addBorderPoints('top');
        addBorderPoints('bottom');
        addBorderPoints('left');
        addBorderPoints('right');
      }

      points.forEach(pt => {
        const sPoint = toScreen(pt.px, pt.py);
        const nX = sPoint.x / glCanvas.width;
        const nY = 1.0 - (sPoint.y / glCanvas.height);
        if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
          solver.splat(solver.velocity, nX, nY, [pt.vx, pt.vy, 0], rad, aspect);
          const borderDyeScale = 0.4;
          const ptCol = scaledCol.map((c: number) => c * borderDyeScale);
          solver.splat(solver.dye, nX, nY, ptCol, rad, aspect);
        }
      });
    }
  }
}

/**
 * Splat mouse drag interaction (velocity + optional dye when activeTool === 'select').
 */
export function splatMouseDrag(
  solver: FluidSolver,
  mouse: MouseState,
  glCanvas: HTMLCanvasElement,
  activeTool: string,
  smokeColor: RGBColor,
  aspect: number
): void {
  const mx = mouse.x / glCanvas.width;
  const my = 1.0 - (mouse.y / glCanvas.height);

  const forceX = (mouse.x - mouse.px) * 0.005;
  const forceY = -(mouse.y - mouse.py) * 0.005;

  solver.splat(solver.velocity, mx, my, [forceX, forceY, 0], 0.01, aspect);

  if (activeTool === 'select') {
    const scaledMouseCol = smokeColor.map((c: number) => c * 0.06);
    solver.splat(solver.dye, mx, my, scaledMouseCol, 0.012, aspect);
  }

  mouse.px = mouse.x;
  mouse.py = mouse.y;
  mouse.isMoving = false;
}
