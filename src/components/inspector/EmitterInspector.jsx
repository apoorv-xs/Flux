
import { Trash2, Radio } from 'lucide-react';
import { rgbToHex, hexToRgb } from '../../utils/color';

export default function EmitterInspector({ node, updateNodeProp, handleDeleteNode }) {
  const colorHex = rgbToHex(node.color?.[0] || 1, node.color?.[1] || 0, node.color?.[2] || 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px 8px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', marginBottom: '6px' }}>
        <Radio size={14} style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="glow-cyan" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>
          FLUID EMITTER
        </h3>
      </div>

      <div className="control-group">
        <label>Spray Pattern Mode</label>
        <div className="segmented-control">
          {[
            { value: 'continuous', label: 'Stream' },
            { value: 'pulse', label: 'Pulse' },
            { value: 'sweep', label: 'Sweep' },
          ].map(({ value, label }) => (
            <button
              key={value}
              className={`segment ${(node.emitterMode || 'continuous') === value ? 'active' : ''}`}
              onClick={() => updateNodeProp('emitterMode', value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(node.emitterMode || 'continuous') !== 'sweep' && (
        <div className="control-group">
          <label>Spray Direction Angle</label>
          <div className="control-row-inline">
            <input
              type="range"
              className="premium"
              min="0"
              max="360"
              value={node.angle || 0}
              onChange={(e) => updateNodeProp('angle', parseFloat(e.target.value))}
            />
            <span className="value-badge">{node.angle || 0}°</span>
          </div>
        </div>
      )}

      {node.emitterMode === 'sweep' && (
        <>
          <div className="control-group">
            <label>Sweep Arc Range (±°)</label>
            <div className="control-row-inline">
              <input
                type="range"
                className="premium"
                min="10"
                max="90"
                value={node.emitterSweepRange || 45}
                onChange={(e) => updateNodeProp('emitterSweepRange', parseFloat(e.target.value))}
              />
              <span className="value-badge">{node.emitterSweepRange || 45}°</span>
            </div>
          </div>
          <div className="control-group">
            <label>Sweep Speed</label>
            <div className="control-row-inline">
              <input
                type="range"
                className="premium"
                min="0.5"
                max="5.0"
                step="0.1"
                value={node.emitterSweepSpeed || 2.0}
                onChange={(e) => updateNodeProp('emitterSweepSpeed', parseFloat(e.target.value))}
              />
              <span className="value-badge">{node.emitterSweepSpeed || 2.0}x</span>
            </div>
          </div>
        </>
      )}

      {node.emitterMode === 'pulse' && (
        <div className="control-group">
          <label>Pulse Frequency</label>
          <div className="control-row-inline">
            <input
              type="range"
              className="premium"
              min="0.5"
              max="8.0"
              step="0.1"
              value={node.emitterPulseFreq || 2.0}
              onChange={(e) => updateNodeProp('emitterPulseFreq', parseFloat(e.target.value))}
            />
            <span className="value-badge">{node.emitterPulseFreq || 2.0}Hz</span>
          </div>
        </div>
      )}

      <div className="section-separator" />

      <div className="control-group">
        <label>Spray Velocity / Force</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="10"
            max="120"
            value={node.speed || 50}
            onChange={(e) => updateNodeProp('speed', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.speed}</span>
        </div>
      </div>

      <div className="control-group">
        <label>Spray Radius (Width)</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="0.005"
            max="0.04"
            step="0.001"
            value={node.radius || 0.015}
            onChange={(e) => updateNodeProp('radius', parseFloat(e.target.value))}
          />
          <span className="value-badge">{Math.round((node.radius || 0.015) * 1000)}u</span>
        </div>
      </div>

      <div className="control-group">
        <label>Dye Ink Density</label>
        <div className="control-row-inline">
          <input
            type="range"
            className="premium"
            min="0.1"
            max="3.0"
            step="0.1"
            value={node.emitterDensity !== undefined ? node.emitterDensity : 1.0}
            onChange={(e) => updateNodeProp('emitterDensity', parseFloat(e.target.value))}
          />
          <span className="value-badge">{node.emitterDensity !== undefined ? node.emitterDensity : 1.0}</span>
        </div>
      </div>

      <div className="section-separator" />

      <div className="control-group">
        <label>Emitter Dye Color</label>
        <div className="color-picker-container">
          <div className="color-swatch">
            <input
              type="color"
              value={colorHex}
              onChange={(e) => updateNodeProp('color', hexToRgb(e.target.value))}
            />
          </div>
          <span className="color-hex">{colorHex.toUpperCase()}</span>
        </div>
      </div>

      <button className="btn-delete-premium" onClick={handleDeleteNode}>
        <Trash2 size={13} /> Delete Emitter
      </button>
    </div>
  );
}
