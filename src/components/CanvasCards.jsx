
import { Radio, Wind, Orbit } from 'lucide-react';
import { resolveCardStyles } from '../utils/cardStyles';
import { hexToRgbaStr } from '../utils/color';

/**
 * DOM cards layer — renders glassmorphic obstacle cards and
 * gizmo circles for emitters, wind tunnels, and vortexes.
 * Pure render component with no internal state.
 */
export default function CanvasCards({
  nodes,
  zoom,
  selectedNodeId,
  activeTool,
  toScreen,
  startDragNode,
  startResizeNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none'
      }}
    >
      {nodes.map(node => {
        const screenPos = toScreen(node.x, node.y);
        const isSelected = selectedNodeId === node.id;

        // Obstacle cards with full glassmorphic styling
        if (node.type === 'obstacle') {
          const dissolveLevel = node.dissolveLevel || 0;
          if (dissolveLevel >= 0.99) return null;

          const w = node.width * zoom;
          const h = node.height * zoom;
          const s = resolveCardStyles(node, { zoom, isSelected });

          return (
            <div
              key={node.id}
              className={`canvas-card ${isSelected ? 'selected' : ''}`}
              style={{
                left: screenPos.x,
                top: screenPos.y,
                width: w,
                height: h,
                borderRadius: s.radius,
                opacity: 1 - dissolveLevel,
                transform: `scale(${1 - dissolveLevel * 0.1})`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: `${s.paddingY * zoom}px ${s.paddingX * zoom}px`,
                fontSize: Math.max(10, s.titleSize * zoom),
                border: s.border,
                background: s.bg,
                backdropFilter: s.blur,
                WebkitBackdropFilter: s.blur,
                boxShadow: s.shadow,
                cursor: activeTool === 'select' ? 'default' : 'crosshair'
              }}
              onMouseDown={(e) => startDragNode(e, node)}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              {node.elementClass === 'button' && (
                <button
                  className="btn-neon"
                  style={{
                    pointerEvents: 'none',
                    fontSize: Math.max(9, s.titleSize * zoom),
                    fontWeight: s.titleWeight,
                    letterSpacing: `${s.titleLetterSpacing * zoom}px`,
                    borderColor: node.burner ? 'var(--accent-pink)' : s.borderRgba,
                    color: s.titleColor,
                    background: s.bg,
                    boxShadow: node.burner ? '0 0 10px rgba(255, 0, 127, 0.2)' : s.shadow,
                    padding: `${6 * zoom}px ${12 * zoom}px`,
                    borderRadius: `${(s.borderRadius > 4 ? s.borderRadius - 2 : s.borderRadius) * zoom}px`
                  }}
                >
                  {!node.cardHideText ? (node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'Submit')) : ''}
                </button>
              )}

              {(node.elementClass === 'card' || node.elementClass === 'text') && !node.cardHideText && (
                <div style={{ textAlign: node.cardTextAlign || 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: s.contentGap * zoom }}>
                  <div style={{
                    fontWeight: s.titleWeight,
                    color: s.titleColor,
                    fontSize: Math.max(10, s.titleSize * zoom),
                    letterSpacing: `${s.titleLetterSpacing * zoom}px`,
                    lineHeight: s.titleLineHeight
                  }}>
                    {node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'Info Card')}
                  </div>
                  {s.subtext && (
                    <div style={{
                      fontSize: Math.max(8, s.subSize * zoom),
                      color: s.subColor,
                      fontWeight: s.subWeight,
                      letterSpacing: `${s.subLetterSpacing * zoom}px`
                    }}>
                      {s.subtext}
                    </div>
                  )}
                </div>
              )}

              {node.elementClass === 'header' && !node.cardHideText && (
                <h2 style={{
                  fontWeight: s.titleWeight,
                  letterSpacing: `${s.titleLetterSpacing * zoom}px`,
                  color: s.titleColor,
                  textAlign: node.cardTextAlign || 'center',
                  fontSize: Math.max(12, s.titleSize * zoom),
                  lineHeight: s.titleLineHeight,
                  textShadow: node.burner ? '0 0 8px var(--accent-pink)' : `0 0 8px ${hexToRgbaStr(node.cardShadowColor || '#9d4edd', 0.4)}`
                }}>
                  {node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'HERO SECTION')}
                </h2>
              )}

              {isSelected && activeTool === 'select' && (
                <>
                  <div className="selection-grip tl" onDoubleClick={(e) => e.stopPropagation()} />
                  <div className="selection-grip tr" onDoubleClick={(e) => e.stopPropagation()} />
                  <div className="selection-grip bl" onDoubleClick={(e) => e.stopPropagation()} />
                  <div
                    className="selection-grip br"
                    onMouseDown={(e) => startResizeNode(e, node)}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </>
              )}
            </div>
          );
        }

        // Gizmo circles for Emitters/Tunnels/Vortexes
        if (['emitter', 'windTunnel', 'vortex'].includes(node.type)) {
          const size = 36;
          const isSelected = selectedNodeId === node.id;

          let borderCol = 'var(--accent-violet)';
          let glowCol = 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4)';
          let IconComponent = Wind;

          if (node.type === 'emitter') {
            const r = Math.round((node.color?.[0] || 0.6) * 255);
            const g = Math.round((node.color?.[1] || 0.1) * 255);
            const b = Math.round((node.color?.[2] || 1.0) * 255);
            borderCol = `rgb(${r}, ${g}, ${b})`;
            glowCol = `rgba(${r}, ${g}, ${b}, 0.5)`;
            IconComponent = Radio;
          } else if (node.type === 'vortex') {
            borderCol = 'var(--accent-cyan)';
            glowCol = 'rgba(0, 240, 255, 0.5)';
            IconComponent = Orbit;
          }

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: screenPos.x - size / 2,
                top: screenPos.y - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'grab',
                background: isSelected ? 'rgba(0, 0, 0, 0.85)' : 'rgba(8, 6, 16, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: `1.5px solid ${borderCol}`,
                boxShadow: isSelected
                  ? `0 0 15px ${glowCol}, inset 0 0 8px ${glowCol}`
                  : `0 4px 12px rgba(0,0,0,0.6), 0 0 5px ${glowCol}`,
                pointerEvents: 'auto',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onMouseDown={(e) => startDragNode(e, node)}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <IconComponent size={14} style={{ color: borderCol }} />

              {node.type === 'windTunnel' && (
                <div
                  style={{
                    position: 'absolute',
                    left: size / 2 - (node.width * zoom) / 2,
                    top: size / 2 - (node.height * zoom) / 2,
                    width: node.width * zoom,
                    height: node.height * zoom,
                    border: isSelected ? '1px dashed var(--accent-cyan)' : '1px dashed rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3)',
                    borderRadius: 4,
                    zIndex: -1,
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
