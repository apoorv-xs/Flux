import React from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

export default function Inspector({
  nodes,
  setNodes,
  selectedNodeId,
  setSelectedNodeId,
  isPlayMode,
  setIsPlayMode,
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

  // Update properties of the selected node
  const updateNodeProp = (key, value) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === selectedNodeId ? { ...node, [key]: value } : node
      )
    );
  };

  // Delete selected node
  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  };

  // Render Emitter controls
  const renderEmitterInspector = (node) => {
    // node.color is [r, g, b] (0-1)
    const colorHex = rgbToHex(node.color?.[0] || 1, node.color?.[1] || 0, node.color?.[2] || 1);

    const handleColorChange = (e) => {
      const hex = e.target.value;
      const rgb = hexToRgb(hex);
      updateNodeProp('color', rgb);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 className="glow-cyan" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '6px' }}>
          FLUID EMITTER
        </h3>

        <div className="control-group">
          <label style={labelStyle}>Spray Pattern Mode</label>
          <select
            value={node.emitterMode || 'continuous'}
            onChange={(e) => updateNodeProp('emitterMode', e.target.value)}
            style={{ width: '100%', marginTop: '4px' }}
          >
            <option value="continuous">Continuous Stream</option>
            <option value="pulse">Pulse Wave (Rhythmic)</option>
            <option value="sweep">Swiveling Sweep (Sprinkler)</option>
          </select>
        </div>

        {(node.emitterMode || 'continuous') !== 'sweep' && (
          <div className="control-group">
            <label style={labelStyle}>Spray Direction Angle</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="360"
                value={node.angle || 0}
                onChange={(e) => updateNodeProp('angle', parseFloat(e.target.value))}
              />
              <span style={valStyle}>{node.angle || 0}°</span>
            </div>
          </div>
        )}

        {node.emitterMode === 'sweep' && (
          <>
            <div className="control-group">
              <label style={labelStyle}>Sweep Arc Range (±°)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={node.emitterSweepRange || 45}
                  onChange={(e) => updateNodeProp('emitterSweepRange', parseFloat(e.target.value))}
                />
                <span style={valStyle}>{node.emitterSweepRange || 45}°</span>
              </div>
            </div>
            <div className="control-group">
              <label style={labelStyle}>Sweep Speed</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={node.emitterSweepSpeed || 2.0}
                  onChange={(e) => updateNodeProp('emitterSweepSpeed', parseFloat(e.target.value))}
                />
                <span style={valStyle}>{node.emitterSweepSpeed || 2.0}</span>
              </div>
            </div>
          </>
        )}

        {node.emitterMode === 'pulse' && (
          <div className="control-group">
            <label style={labelStyle}>Pulse Frequency</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={node.emitterPulseFreq || 2.0}
                onChange={(e) => updateNodeProp('emitterPulseFreq', parseFloat(e.target.value))}
              />
              <span style={valStyle}>{node.emitterPulseFreq || 2.0}Hz</span>
            </div>
          </div>
        )}

        <div className="control-group">
          <label style={labelStyle}>Spray Velocity / Force</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="10"
              max="120"
              value={node.speed || 50}
              onChange={(e) => updateNodeProp('speed', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.speed}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Spray Radius (Width)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.005"
              max="0.04"
              step="0.001"
              value={node.radius || 0.015}
              onChange={(e) => updateNodeProp('radius', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{Math.round((node.radius || 0.015) * 1000)}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Dye Ink Density</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={node.emitterDensity !== undefined ? node.emitterDensity : 1.0}
              onChange={(e) => updateNodeProp('emitterDensity', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.emitterDensity !== undefined ? node.emitterDensity : 1.0}</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Emitter Dye Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="color"
              value={colorHex}
              onChange={handleColorChange}
              style={{ border: 'none', background: 'none', cursor: 'pointer', width: '32px', height: '32px' }}
            />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              {colorHex.toUpperCase()}
            </span>
          </div>
        </div>

        <button className="btn-neon danger" onClick={handleDeleteNode} style={{ marginTop: '10px' }}>
          <Trash2 size={12} /> Delete Emitter
        </button>
      </div>
    );
  };

  // Render Vortex controls
  const renderVortexInspector = (node) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 className="glow-purple" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(157, 78, 221, 0.2)', paddingBottom: '6px' }}>
          GRAVITY VORTEX
        </h3>

        <div className="control-group">
          <label style={labelStyle}>Vortex Strength</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="-100"
              max="100"
              value={node.strength || 40}
              onChange={(e) => updateNodeProp('strength', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.strength}</span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Positive spins clockwise, negative spins counter-clockwise.
          </p>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Influence Radius</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="30"
              max="200"
              value={node.radius || 80}
              onChange={(e) => updateNodeProp('radius', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.radius}px</span>
          </div>
        </div>

        <button className="btn-neon danger" onClick={handleDeleteNode} style={{ marginTop: '10px' }}>
          <Trash2 size={12} /> Delete Vortex
        </button>
      </div>
    );
  };

  // Render Wind Tunnel controls
  const renderWindTunnelInspector = (node) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 className="glow-cyan" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '6px' }}>
          WIND TUNNEL
        </h3>

        <div className="control-group">
          <label style={labelStyle}>Wind Direction Angle</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="0"
              max="360"
              value={node.angle || 0}
              onChange={(e) => updateNodeProp('angle', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.angle}°</span>
          </div>
        </div>

        <div className="control-group">
          <label style={labelStyle}>Wind Speed / Force</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="range"
              min="10"
              max="100"
              value={node.speed || 50}
              onChange={(e) => updateNodeProp('speed', parseFloat(e.target.value))}
            />
            <span style={valStyle}>{node.speed}</span>
          </div>
        </div>

        <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Width</label>
            <input
              type="number"
              value={node.width || 160}
              onChange={(e) => updateNodeProp('width', Math.max(40, parseInt(e.target.value) || 0))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Height</label>
            <input
              type="number"
              value={node.height || 80}
              onChange={(e) => updateNodeProp('height', Math.max(20, parseInt(e.target.value) || 0))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>

        <button className="btn-neon danger" onClick={handleDeleteNode} style={{ marginTop: '10px' }}>
          <Trash2 size={12} /> Delete Tunnel
        </button>
      </div>
    );
  };

  // Render UI Obstacle controls
  const renderObstacleInspector = (node) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 className="glow-purple" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(157, 78, 221, 0.2)', paddingBottom: '6px', marginBottom: '8px' }}>
          STYLE CUSTOMIZER
        </h3>

        {/* 1. Layout & Sizing */}
        <details open className="custom-accordion">
          <summary>📐 Layout & Sizing</summary>
          <div className="custom-accordion-content">
            <div className="control-group">
              <label style={labelStyle}>Element Type</label>
              <select
                value={node.elementClass || 'card'}
                onChange={(e) => updateNodeProp('elementClass', e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              >
                <option value="card">Display Panel (&lt;div&gt; card)</option>
                <option value="button">Interactive Button (&lt;button&gt;)</option>
                <option value="header">Hero Header (&lt;h2&gt; heading)</option>
                <option value="text">Text Box (No Borders / Fill)</option>
              </select>
            </div>

            <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Width</label>
                <input
                  type="number"
                  value={node.width || 150}
                  onChange={(e) => updateNodeProp('width', Math.max(30, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Height</label>
                <input
                  type="number"
                  value={node.height || 60}
                  onChange={(e) => updateNodeProp('height', Math.max(20, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            {node.elementClass !== 'text' && (
              <div className="control-group">
                <label style={labelStyle}>Corner Radius</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12}
                    onChange={(e) => updateNodeProp('cardBorderRadius', parseInt(e.target.value))}
                  />
                  <span style={valStyle}>{node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12}px</span>
                </div>
              </div>
            )}

            <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Padding X</label>
                <input
                  type="number"
                  value={node.cardPaddingX !== undefined ? node.cardPaddingX : 16}
                  onChange={(e) => updateNodeProp('cardPaddingX', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Padding Y</label>
                <input
                  type="number"
                  value={node.cardPaddingY !== undefined ? node.cardPaddingY : 12}
                  onChange={(e) => updateNodeProp('cardPaddingY', Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div className="control-group">
              <label style={labelStyle}>Content Vertical Gap</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={node.cardContentGap !== undefined ? node.cardContentGap : 6}
                  onChange={(e) => updateNodeProp('cardContentGap', parseInt(e.target.value))}
                />
                <span style={valStyle}>{node.cardContentGap !== undefined ? node.cardContentGap : 6}px</span>
              </div>
            </div>
          </div>
        </details>

        {/* 2. Background Fill */}
        {node.elementClass !== 'text' && (
          <details className="custom-accordion">
            <summary>🎨 Background Fill</summary>
            <div className="custom-accordion-content">
              <div className="control-group">
                <label style={labelStyle}>Fill Type</label>
                <select
                  value={node.cardBgType || 'solid'}
                  onChange={(e) => updateNodeProp('cardBgType', e.target.value)}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="solid">Solid Tint</option>
                  <option value="gradient">Linear Gradient</option>
                </select>
              </div>

              <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>{node.cardBgType === 'gradient' ? 'Start Color' : 'Color'}</label>
                  <input
                    type="color"
                    value={node.cardBgColor1 || '#141020'}
                    onChange={(e) => updateNodeProp('cardBgColor1', e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '28px', marginTop: '4px' }}
                  />
                </div>
                {node.cardBgType === 'gradient' && (
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>End Color</label>
                    <input
                      type="color"
                      value={node.cardBgColor2 || '#0a0814'}
                      onChange={(e) => updateNodeProp('cardBgColor2', e.target.value)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '28px', marginTop: '4px' }}
                    />
                  </div>
                )}
              </div>

              {node.cardBgType === 'gradient' && (
                <div className="control-group">
                  <label style={labelStyle}>Gradient Angle</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={node.cardBgAngle !== undefined ? node.cardBgAngle : 135}
                      onChange={(e) => updateNodeProp('cardBgAngle', parseInt(e.target.value))}
                    />
                    <span style={valStyle}>{node.cardBgAngle !== undefined ? node.cardBgAngle : 135}°</span>
                  </div>
                </div>
              )}

              <div className="control-group">
                <label style={labelStyle}>Opacity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={node.cardBgOpacity !== undefined ? node.cardBgOpacity : 0.35}
                    onChange={(e) => updateNodeProp('cardBgOpacity', parseFloat(e.target.value))}
                  />
                  <span style={valStyle}>{Math.round((node.cardBgOpacity !== undefined ? node.cardBgOpacity : 0.35) * 100)}%</span>
                </div>
              </div>

              <div className="control-group">
                <label style={labelStyle}>Backdrop Blur</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={node.cardBlur !== undefined ? node.cardBlur : 16}
                    onChange={(e) => updateNodeProp('cardBlur', parseInt(e.target.value))}
                  />
                  <span style={valStyle}>{node.cardBlur !== undefined ? node.cardBlur : 16}px</span>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* 3. Borders & Stroke */}
        {node.elementClass !== 'text' && (
          <details className="custom-accordion">
            <summary>✏️ Border & Stroke</summary>
            <div className="custom-accordion-content">
              <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stroke Width</label>
                  <input
                    type="number"
                    value={node.cardBorderWidth !== undefined ? node.cardBorderWidth : 1}
                    onChange={(e) => updateNodeProp('cardBorderWidth', Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stroke Style</label>
                  <select
                    value={node.cardBorderStyle || 'solid'}
                    onChange={(e) => updateNodeProp('cardBorderStyle', e.target.value)}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                  </select>
                </div>
              </div>

              <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stroke Color</label>
                  <input
                    type="color"
                    value={node.cardBorderColor || '#9d4edd'}
                    onChange={(e) => updateNodeProp('cardBorderColor', e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '28px', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Stroke Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={node.cardBorderOpacity !== undefined ? node.cardBorderOpacity : 0.25}
                    onChange={(e) => updateNodeProp('cardBorderOpacity', parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              </div>
            </div>
          </details>
        )}

        {/* 4. Typography Styling */}
        <details className="custom-accordion">
          <summary>🔤 Typography Styling</summary>
          <div className="custom-accordion-content">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', marginBottom: '6px', borderBottom: '1px solid rgba(157, 78, 221, 0.08)', paddingBottom: '6px' }}>
              <input
                type="checkbox"
                checked={node.cardHideText !== true}
                onChange={(e) => updateNodeProp('cardHideText', !e.target.checked)}
              />
              Show Text Content
            </label>

            {node.cardHideText !== true && (
              <>
                {/* Title Control */}
                <div style={{ borderBottom: '1px solid rgba(157, 78, 221, 0.1)', paddingBottom: '8px', marginBottom: '8px' }}>
                  <label style={{ ...labelStyle, color: '#fff' }}>Title Line</label>
                  <div className="control-group" style={{ marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="Enter Title label..."
                      value={node.cardTitleText !== undefined ? node.cardTitleText : (node.label || '')}
                      onChange={(e) => {
                        updateNodeProp('cardTitleText', e.target.value);
                        updateNodeProp('label', e.target.value); // Sync label
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Font Color</label>
                      <input
                        type="color"
                        value={node.cardTextColor || '#FFFFFF'}
                        onChange={(e) => updateNodeProp('cardTextColor', e.target.value)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '24px', marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Font Size</label>
                      <input
                        type="number"
                        value={node.cardFontSize || 14}
                        onChange={(e) => updateNodeProp('cardFontSize', Math.max(8, parseInt(e.target.value) || 0))}
                        style={{ width: '100%', marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Font Weight</label>
                      <select
                        value={node.cardTitleWeight || '600'}
                        onChange={(e) => updateNodeProp('cardTitleWeight', e.target.value)}
                        style={{ width: '100%', marginTop: '4px' }}
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Regular (400)</option>
                        <option value="600">Semi-bold (600)</option>
                        <option value="800">Bold (800)</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Alignment</label>
                      <select
                        value={node.cardTextAlign || 'center'}
                        onChange={(e) => updateNodeProp('cardTextAlign', e.target.value)}
                        style={{ width: '100%', marginTop: '4px' }}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Letter Spac.</label>
                      <input
                        type="range"
                        min="-2"
                        max="10"
                        value={node.cardTitleLetterSpacing !== undefined ? node.cardTitleLetterSpacing : 0}
                        onChange={(e) => updateNodeProp('cardTitleLetterSpacing', parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Line Height</label>
                      <input
                        type="range"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        value={node.cardTitleLineHeight !== undefined ? node.cardTitleLineHeight : 1.2}
                        onChange={(e) => updateNodeProp('cardTitleLineHeight', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subtitle Control */}
                {(node.elementClass === 'card' || node.elementClass === 'text') && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ ...labelStyle, color: '#fff' }}>Subtitle Line</label>
                    <div className="control-group" style={{ marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="Enter Subtitle label..."
                        value={node.cardSubtext !== undefined ? node.cardSubtext : 'Interactive Panel'}
                        onChange={(e) => updateNodeProp('cardSubtext', e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Sub Color</label>
                        <input
                          type="color"
                          value={node.cardSubColor || '#C77DFF'}
                          onChange={(e) => updateNodeProp('cardSubColor', e.target.value)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '24px', marginTop: '4px' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Sub Size</label>
                        <input
                          type="number"
                          value={node.cardSubSize || 10}
                          onChange={(e) => updateNodeProp('cardSubSize', Math.max(6, parseInt(e.target.value) || 0))}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Sub Weight</label>
                        <select
                          value={node.cardSubWeight || '400'}
                          onChange={(e) => updateNodeProp('cardSubWeight', e.target.value)}
                          style={{ width: '100%', marginTop: '4px' }}
                        >
                          <option value="300">Light (300)</option>
                          <option value="400">Regular (400)</option>
                          <option value="600">Semi-bold (600)</option>
                          <option value="800">Bold (800)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Sub Spacing</label>
                        <input
                          type="range"
                          min="-2"
                          max="10"
                          value={node.cardSubLetterSpacing !== undefined ? node.cardSubLetterSpacing : 0}
                          onChange={(e) => updateNodeProp('cardSubLetterSpacing', parseInt(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </details>

        {/* 5. Shadow & Glow */}
        {node.elementClass !== 'text' && (
          <details className="custom-accordion">
            <summary>🌗 Shadow & Elevation</summary>
            <div className="custom-accordion-content">
              <div className="control-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Shadow Color</label>
                  <input
                    type="color"
                    value={node.cardShadowColor || '#9d4edd'}
                    onChange={(e) => updateNodeProp('cardShadowColor', e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', height: '28px', marginTop: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={node.cardShadowOpacity !== undefined ? node.cardShadowOpacity : 0.4}
                    onChange={(e) => updateNodeProp('cardShadowOpacity', parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              </div>

              <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Offset X (px)</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={node.cardShadowX !== undefined ? node.cardShadowX : 0}
                    onChange={(e) => updateNodeProp('cardShadowX', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Offset Y (px)</label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={node.cardShadowY !== undefined ? node.cardShadowY : 0}
                    onChange={(e) => updateNodeProp('cardShadowY', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="control-group" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Blur Size</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={node.cardShadowBlur !== undefined ? node.cardShadowBlur : 15}
                    onChange={(e) => updateNodeProp('cardShadowBlur', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Spread Size</label>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    value={node.cardShadowSpread !== undefined ? node.cardShadowSpread : 0}
                    onChange={(e) => updateNodeProp('cardShadowSpread', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </details>
        )}

        {/* 6. Physics Modifiers */}
        <details className="custom-accordion">
          <summary>⚡ Physics Modifiers</summary>
          <div className="custom-accordion-content">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={node.collider !== false}
                onChange={(e) => updateNodeProp('collider', e.target.checked)}
              />
              Solid Collider (Deflects fluid flow)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={node.burner || false}
                onChange={(e) => updateNodeProp('burner', e.target.checked)}
              />
              Thermal Burner (Hot upward drafts)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={node.dissolver || false}
                onChange={(e) => updateNodeProp('dissolver', e.target.checked)}
              />
              Liquid Dissolver (Hover to melt)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={node.cardEmitter || false}
                onChange={(e) => updateNodeProp('cardEmitter', e.target.checked)}
              />
              Card Emitter (Spray Fluid)
            </label>

            {node.cardEmitter && (
              <div style={{ borderTop: '1px solid rgba(157, 78, 221, 0.1)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="control-group">
                  <label style={labelStyle}>Emitter Source Location</label>
                  <select
                    value={node.emitterLocation || 'center'}
                    onChange={(e) => updateNodeProp('emitterLocation', e.target.value)}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="center">Card Center (Angle directional)</option>
                    <option value="top">Top Border (Upward flows)</option>
                    <option value="bottom">Bottom Border (Downward flows)</option>
                    <option value="left">Left Border (Leftward flows)</option>
                    <option value="right">Right Border (Rightward flows)</option>
                    <option value="outline">Full Outline (Outward flows)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label style={labelStyle}>Spray Pattern Mode</label>
                  <select
                    value={node.emitterMode || 'continuous'}
                    onChange={(e) => updateNodeProp('emitterMode', e.target.value)}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="continuous">Continuous Stream</option>
                    <option value="pulse">Pulse Wave (Rhythmic)</option>
                    <option value="sweep">Swiveling Sweep (Sprinkler)</option>
                  </select>
                </div>

                {(node.emitterLocation || 'center') === 'center' && (node.emitterMode || 'continuous') !== 'sweep' && (
                  <div className="control-group">
                    <label style={labelStyle}>Emitter Angle</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={node.emitterAngle || 0}
                        onChange={(e) => updateNodeProp('emitterAngle', parseFloat(e.target.value))}
                      />
                      <span style={valStyle}>{node.emitterAngle || 0}°</span>
                    </div>
                  </div>
                )}

                {node.emitterMode === 'sweep' && (node.emitterLocation || 'center') === 'center' && (
                  <>
                    <div className="control-group">
                      <label style={labelStyle}>Sweep Arc Range (±°)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min="10"
                          max="90"
                          value={node.emitterSweepRange || 45}
                          onChange={(e) => updateNodeProp('emitterSweepRange', parseFloat(e.target.value))}
                        />
                        <span style={valStyle}>{node.emitterSweepRange || 45}°</span>
                      </div>
                    </div>
                    <div className="control-group">
                      <label style={labelStyle}>Sweep Speed</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.1"
                          value={node.emitterSweepSpeed || 2.0}
                          onChange={(e) => updateNodeProp('emitterSweepSpeed', parseFloat(e.target.value))}
                        />
                        <span style={valStyle}>{node.emitterSweepSpeed || 2.0}</span>
                      </div>
                    </div>
                  </>
                )}

                {node.emitterMode === 'pulse' && (
                  <div className="control-group">
                    <label style={labelStyle}>Pulse Frequency</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="range"
                        min="0.5"
                        max="8.0"
                        step="0.1"
                        value={node.emitterPulseFreq || 2.0}
                        onChange={(e) => updateNodeProp('emitterPulseFreq', parseFloat(e.target.value))}
                      />
                      <span style={valStyle}>{node.emitterPulseFreq || 2.0}Hz</span>
                    </div>
                  </div>
                )}

                <div className="control-group">
                  <label style={labelStyle}>Emitter Force / Velocity</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="10"
                      max="120"
                      value={node.emitterSpeed || 50}
                      onChange={(e) => updateNodeProp('emitterSpeed', parseFloat(e.target.value))}
                    />
                    <span style={valStyle}>{node.emitterSpeed || 50}</span>
                  </div>
                </div>

                <div className="control-group">
                  <label style={labelStyle}>Emitter Radius (Width)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0.005"
                      max="0.05"
                      step="0.001"
                      value={node.emitterRadius || 0.02}
                      onChange={(e) => updateNodeProp('emitterRadius', parseFloat(e.target.value))}
                    />
                    <span style={valStyle}>{Math.round((node.emitterRadius || 0.02) * 1000)}</span>
                  </div>
                </div>

                <div className="control-group">
                  <label style={labelStyle}>Dye Ink Density</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={node.emitterDensity !== undefined ? node.emitterDensity : 1.0}
                      onChange={(e) => updateNodeProp('emitterDensity', parseFloat(e.target.value))}
                    />
                    <span style={valStyle}>{node.emitterDensity !== undefined ? node.emitterDensity : 1.0}</span>
                  </div>
                </div>

                <div className="control-group">
                  <label style={labelStyle}>Emitter Dye Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <input
                      type="color"
                      value={rgbToHex(node.emitterColor?.[0] || 0.0, node.emitterColor?.[1] || 0.94, node.emitterColor?.[2] || 1.0)}
                      onChange={(e) => updateNodeProp('emitterColor', hexToRgb(e.target.value))}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', width: '28px', height: '28px' }}
                    />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {rgbToHex(node.emitterColor?.[0] || 0.0, node.emitterColor?.[1] || 0.94, node.emitterColor?.[2] || 1.0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </details>

        <button className="btn-neon danger" onClick={handleDeleteNode} style={{ marginTop: '6px' }}>
          <Trash2 size={12} /> Delete Card
        </button>
      </div>
    );
  };

  // Render Global Settings
  const renderGlobalInspector = () => {
    const brushCol = rgbToHex(smokeColor[0], smokeColor[1], smokeColor[2]);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 className="glow-purple" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', borderBottom: '1px solid rgba(157, 78, 221, 0.2)', paddingBottom: '6px' }}>
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
          ? renderEmitterInspector(selectedNode)
          : selectedNode.type === 'vortex'
            ? renderVortexInspector(selectedNode)
            : selectedNode.type === 'windTunnel'
              ? renderWindTunnelInspector(selectedNode)
              : renderObstacleInspector(selectedNode)
        : renderGlobalInspector()}
    </div>
  );
}

// Styling definitions
const labelStyle = {
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase'
};

const valStyle = {
  fontSize: '10px',
  fontFamily: 'var(--font-mono)',
  color: '#fff',
  minWidth: '32px',
  textAlign: 'right'
};



// Conversions helpers
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ]
    : [1, 0, 1];
}
