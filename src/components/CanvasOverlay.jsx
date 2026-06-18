import { useState, useEffect } from 'react';

/**
 * SVG vector overlay — renders directional arrows for emitters,
 * wind tunnels, vortex rings, and card emitter indicators.
 */
export default function CanvasOverlay({
  nodes,
  zoom,
  toScreen,
  startRotateNode
}) {
  const [time, setTime] = useState(() => Date.now() / 1000);

  const hasSweep = nodes.some(
    node =>
      (node.type === 'emitter' && node.emitterMode === 'sweep') ||
      (node.type === 'obstacle' && node.cardEmitter && node.emitterMode === 'sweep')
  );

  useEffect(() => {
    if (!hasSweep) return;
    let animFrame;
    const tick = () => {
      setTime(Date.now() / 1000);
      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [hasSweep]);
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-cyan)" />
        </marker>
        <marker
          id="arrow-violet"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--accent-violet)" />
        </marker>
      </defs>

      {nodes.map(node => {
        if (node.type === 'emitter') {
          const screenPos = toScreen(node.x, node.y);
          const nowSec = time;
          let activeAngle = node.angle || 0;
          if (node.emitterMode === 'sweep') {
            activeAngle = (node.angle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
          }
          const angleRad = (activeAngle * Math.PI) / 180;
          const arrowLen = Math.max(30, (node.speed || 50) * 0.8) * zoom;
          const endX = screenPos.x + Math.cos(angleRad) * arrowLen;
          const endY = screenPos.y + Math.sin(angleRad) * arrowLen;

          return (
            <g key={`emitter-vec-${node.id}`}>
              <line
                x1={screenPos.x}
                y1={screenPos.y}
                x2={endX}
                y2={endY}
                stroke="var(--accent-cyan)"
                strokeWidth={2 * zoom}
                markerEnd="url(#arrow)"
                className="vector-pulse"
              />
              <circle
                cx={screenPos.x}
                cy={screenPos.y}
                r={8 * zoom}
                fill="var(--accent-indigo)"
                stroke="var(--accent-cyan)"
                strokeWidth={1.5}
              />
              <circle
                cx={endX}
                cy={endY}
                r={7 * zoom}
                fill="var(--accent-cyan)"
                stroke="#ffffff"
                strokeWidth={1.5}
                style={{ cursor: 'alias', pointerEvents: 'auto', filter: 'drop-shadow(0 0 4px var(--accent-cyan))' }}
                onMouseDown={(e) => startRotateNode(e, node)}
              />
            </g>
          );
        }

        if (node.type === 'windTunnel') {
          const screenPos = toScreen(node.x, node.y);
          const w = node.width * zoom;
          const h = node.height * zoom;
          const angleRad = (node.angle * Math.PI) / 180;

          const cx = screenPos.x + w / 2;
          const cy = screenPos.y + h / 2;
          const wx = Math.cos(angleRad) * (w * 0.45);
          const wy = Math.sin(angleRad) * (h * 0.45);

          return (
            <g key={`tunnel-vec-${node.id}`}>
              <line
                x1={cx - wx}
                y1={cy - wy}
                x2={cx + wx}
                y2={cy + wy}
                stroke="var(--accent-violet)"
                strokeWidth={3 * zoom}
                markerEnd="url(#arrow-violet)"
                className="vector-pulse"
              />
              <circle
                cx={cx + wx}
                cy={cy + wy}
                r={7 * zoom}
                fill="var(--accent-violet)"
                stroke="#ffffff"
                strokeWidth={1.5}
                style={{ cursor: 'alias', pointerEvents: 'auto', filter: 'drop-shadow(0 0 4px var(--accent-violet))' }}
                onMouseDown={(e) => startRotateNode(e, node)}
              />
            </g>
          );
        }

        if (node.type === 'vortex') {
          const screenPos = toScreen(node.x, node.y);
          const r = (node.radius || 80) * zoom;
          return (
            <g key={`vortex-vec-${node.id}`}>
              <circle
                cx={screenPos.x}
                cy={screenPos.y}
                r={r}
                fill="none"
                stroke="rgba(0, 240, 255, 0.15)"
                strokeWidth={1}
                strokeDasharray="5,5"
              />
              <circle
                cx={screenPos.x}
                cy={screenPos.y}
                r={r * 0.5}
                fill="none"
                stroke="rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)"
                strokeWidth={1.5}
                strokeDasharray="4,6"
              />
            </g>
          );
        }

        if (node.type === 'obstacle' && node.cardEmitter) {
          const screenPos = toScreen(node.x, node.y);
          const w = node.width * zoom;
          const h = node.height * zoom;
          const loc = node.emitterLocation || 'center';
          const col = node.emitterColor ? `rgb(${Math.round(node.emitterColor[0] * 255)}, ${Math.round(node.emitterColor[1] * 255)}, ${Math.round(node.emitterColor[2] * 255)})` : 'var(--accent-cyan)';
          const glow = node.emitterColor ? `rgba(${Math.round(node.emitterColor[0] * 255)}, ${Math.round(node.emitterColor[1] * 255)}, ${Math.round(node.emitterColor[2] * 255)}, 0.6)` : 'rgba(0, 240, 255, 0.6)';

          const padding = 2 * zoom;

          if (loc === 'center') {
            const cx = screenPos.x + w / 2;
            const cy = screenPos.y + h / 2;
            const nowSec = time;
            let activeAngle = node.emitterAngle || 0;
            if (node.emitterMode === 'sweep') {
              activeAngle = (node.emitterAngle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
            }
            const angleRad = (activeAngle * Math.PI) / 180;
            const arrowLen = Math.max(20, (node.emitterSpeed || 50) * 0.5) * zoom;
            const endX = cx + Math.cos(angleRad) * arrowLen;
            const endY = cy + Math.sin(angleRad) * arrowLen;

            return (
              <g key={`card-emitter-center-${node.id}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={6 * zoom}
                  fill="none"
                  stroke={col}
                  strokeWidth={2 * zoom}
                  style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
                />
                <line
                  x1={cx}
                  y1={cy}
                  x2={endX}
                  y2={endY}
                  stroke={col}
                  strokeWidth={1.5 * zoom}
                  markerEnd="url(#arrow)"
                  className="vector-pulse"
                />
                <circle
                  cx={endX}
                  cy={endY}
                  r={6 * zoom}
                  fill={col}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  style={{ cursor: 'alias', pointerEvents: 'auto', filter: `drop-shadow(0 0 4px ${glow})` }}
                  onMouseDown={(e) => startRotateNode(e, node)}
                />
              </g>
            );
          }

          let lines = [];
          if (loc === 'top' || loc === 'outline') {
            lines.push({ x1: screenPos.x, y1: screenPos.y - padding, x2: screenPos.x + w, y2: screenPos.y - padding });
          }
          if (loc === 'bottom' || loc === 'outline') {
            lines.push({ x1: screenPos.x, y1: screenPos.y + h + padding, x2: screenPos.x + w, y2: screenPos.y + h + padding });
          }
          if (loc === 'left' || loc === 'outline') {
            lines.push({ x1: screenPos.x - padding, y1: screenPos.y, x2: screenPos.x - padding, y2: screenPos.y + h });
          }
          if (loc === 'right' || loc === 'outline') {
            lines.push({ x1: screenPos.x + w + padding, y1: screenPos.y, x2: screenPos.x + w + padding, y2: screenPos.y + h });
          }

          return (
            <g key={`card-emitter-border-${node.id}`}>
              {lines.map((line, idx) => (
                <line
                  key={idx}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={col}
                  strokeWidth={2.5 * zoom}
                  strokeDasharray="4, 4"
                  className="vector-pulse"
                  style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                />
              ))}
            </g>
          );
        }

        return null;
      })}
    </svg>
  );
}
