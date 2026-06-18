
import { Trash2, Wind } from 'lucide-react';

export default function WindTunnelInspector({ node, updateNodeProp, handleDeleteNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px 8px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '6px' }}>
        <Wind size={14} style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="glow-cyan" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>
          WIND TUNNEL
        </h3>
      </div>

      <div className="control-group">
        <label>Wind Direction Angle</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="0"
            max="360"
            value={node.angle || 0}
            onChange={(e) => updateNodeProp('angle', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.angle}°</span>
        </div>
      </div>

      <div className="control-group">
        <label>Wind Speed / Force</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="10"
            max="100"
            value={node.speed || 50}
            onChange={(e) => updateNodeProp('speed', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.speed}</span>
        </div>
      </div>

      <div className="section-separator" />

      <div className="control-group">
        <div className="control-row">
          <div>
            <label>Width</label>
            <input
              type="number"
              value={node.width || 160}
              onChange={(e) => updateNodeProp('width', Math.max(40, parseInt(e.target.value) || 0))}
            />
          </div>
          <div>
            <label>Height</label>
            <input
              type="number"
              value={node.height || 80}
              onChange={(e) => updateNodeProp('height', Math.max(20, parseInt(e.target.value) || 0))}
            />
          </div>
        </div>
      </div>

      <button className="btn-delete-premium" onClick={handleDeleteNode}>
        <Trash2 size={13} /> Delete Tunnel
      </button>
    </div>
  );
}
