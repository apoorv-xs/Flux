import { RefreshCw } from 'lucide-react';
import { rgbToHex, hexToRgb } from '../utils/color';
import { labelStyle, valStyle } from './inspector/shared';
import EmitterInspector from './inspector/EmitterInspector';
import VortexInspector from './inspector/VortexInspector';
import WindTunnelInspector from './inspector/WindTunnelInspector';
import ObstacleInspector from './inspector/ObstacleInspector';

export default function Inspector({
  nodes,
  setNodes,
  selectedNodeId,
  setSelectedNodeId,
  renderMode,
  setRenderMode,
  viscosity,
  setViscosity,
  dissipation,
  setDissipation,
  timeStep,
  setTimeStep,
  smokeColor,
  setSmokeColor,
  onResetSimulation
}) {
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeProp = (key, value) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === selectedNodeId ? { ...node, [key]: value } : node
      )
    );
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const renderGlobalInspector = () => {
    const brushCol = rgbToHex(smokeColor[0], smokeColor[1], smokeColor[2]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 className="glow-purple" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2)', paddingBottom: '6px' }}>
          FLUID SYSTEM CONFIG
        </h3>

        <div className="control-group">
          <label style={labelStyle}>Simulation Render Output</label>
          <select
            value={renderMode}
            onChange={(e) => setRenderMode(parseInt(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          >
            <option value={0}>Liquid Dye (Continuous Smoke)</option>
            <option value={1}>Velocity Field Vector Maps</option>
            <option value={2}>Obstacles Collision Mask</option>
          </select>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Viscosity (Thickness)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={viscosity}
              onChange={(e) => setViscosity(parseFloat(e.target.value))}
            />
            <span style={valStyle}>{viscosity}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Dye Fade Rate (Dissipation)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.95"
              max="0.999"
              step="0.001"
              value={dissipation}
              onChange={(e) => setDissipation(parseFloat(e.target.value))}
            />
            <span style={valStyle}>{dissipation}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Simulation Speed (dt)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.005"
              max="0.05"
              step="0.001"
              value={timeStep}
              onChange={(e) => setTimeStep(parseFloat(e.target.value))}
            />
            <span style={valStyle}>{timeStep}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Brush Ink Color (Cursor paint)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="color"
              value={brushCol}
              onChange={(e) => setSmokeColor(hexToRgb(e.target.value))}
              style={{ border: 'none', background: 'none', cursor: 'pointer', width: '32px', height: '32px' }}
            />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {brushCol.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            className="btn-neon secondary"
            onClick={onResetSimulation}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <RefreshCw size={10} /> Clear Dye
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px',
        overflowY: 'auto'
      }}
      className="custom-scrollbar"
    >
      {selectedNode
        ? selectedNode.type === 'emitter'
          ? <EmitterInspector node={selectedNode} updateNodeProp={updateNodeProp} handleDeleteNode={handleDeleteNode} />
          : selectedNode.type === 'vortex'
            ? <VortexInspector node={selectedNode} updateNodeProp={updateNodeProp} handleDeleteNode={handleDeleteNode} />
            : selectedNode.type === 'windTunnel'
              ? <WindTunnelInspector node={selectedNode} updateNodeProp={updateNodeProp} handleDeleteNode={handleDeleteNode} />
              : <ObstacleInspector node={selectedNode} updateNodeProp={updateNodeProp} handleDeleteNode={handleDeleteNode} />
        : renderGlobalInspector()}
    </div>
  );
}
