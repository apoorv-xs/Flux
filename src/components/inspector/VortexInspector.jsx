
import { Trash2, Orbit } from 'lucide-react';

export default function VortexInspector({ node, updateNodeProp, handleDeleteNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px 8px', borderBottom: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)', marginBottom: '6px' }}>
        <Orbit size={14} style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="glow-purple" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>
          GRAVITY VORTEX
        </h3>
      </div>

      <div className="control-group">
        <label>Vortex Strength</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="-100"
            max="100"
            value={node.strength || 40}
            onChange={(e) => updateNodeProp('strength', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.strength}</span>
        </div>
        <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Positive spins clockwise, negative spins counter-clockwise.
        </p>
      </div>

      <div className="section-separator" />

      <div className="control-group">
        <label>Influence Radius</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="30"
            max="200"
            value={node.radius || 80}
            onChange={(e) => updateNodeProp('radius', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.radius}px</span>
        </div>
      </div>

      <button className="btn-delete-premium" onClick={handleDeleteNode}>
        <Trash2 size={13} /> Delete Vortex
      </button>
    </div>
  );
}
