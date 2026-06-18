import { useState } from 'react';
import { Layout, Palette, Type, Triangle, Zap, Trash2, Square, RectangleHorizontal, Heading2, Type as TextBox } from 'lucide-react';
import { rgbToHex, hexToRgb } from '../../utils/color';
import SectionHeader from './SectionHeader';

export default function ObstacleInspector({ node, updateNodeProp, handleDeleteNode }) {
  const [openSections, setOpenSections] = useState({
    layout: true,
    background: false,
    border: false,
    typography: false,
    shadow: false,
    physics: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const elements = [
    { value: 'card', label: 'Panel', icon: Square },
    { value: 'button', label: 'Button', icon: RectangleHorizontal },
    { value: 'header', label: 'Header', icon: Heading2 },
    { value: 'text', label: 'Text', icon: TextBox },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Header */}
      <div style={{ padding: '0 2px 8px', borderBottom: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)', marginBottom: '6px' }}>
        <h3 className="glow-purple" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>
          STYLE CUSTOMIZER
        </h3>
      </div>

      {/* 1. Layout & Sizing */}
      <SectionHeader icon={Layout} title="Layout & Sizing" open={openSections.layout} onToggle={() => toggleSection('layout')} />
      {openSections.layout && (
        <div className="section-content">
          {/* Element Type Segmented Control */}
          <div className="control-group">
            <label>Element Type</label>
            <div className="segmented-control">
              {elements.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`segment ${node.elementClass === value ? 'active' : ''}`}
                  onClick={() => updateNodeProp('elementClass', value)}
                >
                  <div className="seg-icon">
                    <Icon size={14} />
                  </div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Width & Height */}
          <div className="control-group">
            <div className="control-row">
              <div>
                <label>Width</label>
                <input
                  type="number"
                  value={node.width || 150}
                  onChange={(e) => updateNodeProp('width', Math.max(30, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label>Height</label>
                <input
                  type="number"
                  value={node.height || 60}
                  onChange={(e) => updateNodeProp('height', Math.max(20, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          {/* Corner Radius */}
          {node.elementClass !== 'text' && (
            <div className="control-group">
              <label>Corner Radius</label>
              <div className="control-row-inline">
                <input
                  type="range"
                  className="premium"
                  min="0"
                  max="40"
                  value={node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12}
                  onChange={(e) => updateNodeProp('cardBorderRadius', parseInt(e.target.value))}
                />
                <span className="value-badge">{node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12}px</span>
              </div>
            </div>
          )}

          {/* Padding */}
          <div className="control-group">
            <div className="control-row">
              <div>
                <label>Padding X</label>
                <input
                  type="number"
                  value={node.cardPaddingX !== undefined ? node.cardPaddingX : 16}
                  onChange={(e) => updateNodeProp('cardPaddingX', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div>
                <label>Padding Y</label>
                <input
                  type="number"
                  value={node.cardPaddingY !== undefined ? node.cardPaddingY : 12}
                  onChange={(e) => updateNodeProp('cardPaddingY', Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>
          </div>

          {/* Content Gap */}
          <div className="control-group">
            <label>Content Vertical Gap</label>
            <div className="control-row-inline">
              <input
                type="range"
                className="premium"
                min="0"
                max="30"
                value={node.cardContentGap !== undefined ? node.cardContentGap : 6}
                onChange={(e) => updateNodeProp('cardContentGap', parseInt(e.target.value))}
              />
              <span className="value-badge">{node.cardContentGap !== undefined ? node.cardContentGap : 6}px</span>
            </div>
          </div>
        </div>
      )}

      <div className="section-separator" />

      {/* 2. Background Fill */}
      {node.elementClass !== 'text' && (
        <>
          <SectionHeader icon={Palette} title="Background Fill" open={openSections.background} onToggle={() => toggleSection('background')} />
          {openSections.background && (
            <div className="section-content">
              {/* Fill Type Segmented */}
              <div className="control-group">
                <label>Fill Type</label>
                <div className="segmented-control">
                  <button
                    className={`segment ${(!node.cardBgType || node.cardBgType === 'solid') ? 'active' : ''}`}
                    onClick={() => updateNodeProp('cardBgType', 'solid')}
                  >
                    <div className="seg-icon"><Square size={13} /></div>
                    Solid
                  </button>
                  <button
                    className={`segment ${node.cardBgType === 'gradient' ? 'active' : ''}`}
                    onClick={() => updateNodeProp('cardBgType', 'gradient')}
                  >
                    <div className="seg-icon"><Triangle size={13} /></div>
                    Gradient
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>{node.cardBgType === 'gradient' ? 'Start Color' : 'Color'}</label>
                    <div className="color-picker-container">
                      <div className="color-swatch">
                        <input
                          type="color"
                          value={node.cardBgColor1 || '#141020'}
                          onChange={(e) => updateNodeProp('cardBgColor1', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {node.cardBgType === 'gradient' && (
                    <div>
                      <label>End Color</label>
                      <div className="color-picker-container">
                        <div className="color-swatch">
                          <input
                            type="color"
                            value={node.cardBgColor2 || '#0a0814'}
                            onChange={(e) => updateNodeProp('cardBgColor2', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Gradient Angle */}
              {node.cardBgType === 'gradient' && (
                <div className="control-group">
                  <label>Gradient Angle</label>
                  <div className="control-row-inline">
                    <input
                      type="range"
                      className="premium"
                      min="0"
                      max="360"
                      value={node.cardBgAngle !== undefined ? node.cardBgAngle : 135}
                      onChange={(e) => updateNodeProp('cardBgAngle', parseInt(e.target.value))}
                    />
                    <span className="value-badge">{node.cardBgAngle !== undefined ? node.cardBgAngle : 135}°</span>
                  </div>
                </div>
              )}

              {/* Opacity */}
              <div className="control-group">
                <label>Opacity</label>
                <div className="control-row-inline">
                  <input
                    type="range"
                    className="premium"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={node.cardBgOpacity !== undefined ? node.cardBgOpacity : 0.35}
                    onChange={(e) => updateNodeProp('cardBgOpacity', parseFloat(e.target.value))}
                  />
                  <span className="value-badge">{Math.round((node.cardBgOpacity !== undefined ? node.cardBgOpacity : 0.35) * 100)}%</span>
                </div>
              </div>

              {/* Backdrop Blur */}
              <div className="control-group">
                <label>Backdrop Blur</label>
                <div className="control-row-inline">
                  <input
                    type="range"
                    className="premium"
                    min="0"
                    max="40"
                    value={node.cardBlur !== undefined ? node.cardBlur : 16}
                    onChange={(e) => updateNodeProp('cardBlur', parseInt(e.target.value))}
                  />
                  <span className="value-badge">{node.cardBlur !== undefined ? node.cardBlur : 16}px</span>
                </div>
              </div>
            </div>
          )}

          <div className="section-separator" />
        </>
      )}

      {/* 3. Border & Stroke */}
      {node.elementClass !== 'text' && (
        <>
          <SectionHeader icon={Triangle} title="Border & Stroke" open={openSections.border} onToggle={() => toggleSection('border')} />
          {openSections.border && (
            <div className="section-content">
              {/* Width & Style */}
              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Stroke Width</label>
                    <input
                      type="number"
                      value={node.cardBorderWidth !== undefined ? node.cardBorderWidth : 1}
                      onChange={(e) => updateNodeProp('cardBorderWidth', Math.max(0, parseInt(e.target.value) || 0))}
                    />
                  </div>
                  <div>
                    <label>Stroke Style</label>
                    <select
                      value={node.cardBorderStyle || 'solid'}
                      onChange={(e) => updateNodeProp('cardBorderStyle', e.target.value)}
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Color & Opacity */}
              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Stroke Color</label>
                    <div className="color-picker-container">
                      <div className="color-swatch">
                        <input
                          type="color"
                          value={node.cardBorderColor || '#9d4edd'}
                          onChange={(e) => updateNodeProp('cardBorderColor', e.target.value)}
                        />
                      </div>
                      <span className="color-hex">{(node.cardBorderColor || '#9d4edd').toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <label>Stroke Opacity</label>
                    <div className="control-row-inline" style={{ marginTop: '6px' }}>
                      <input
                        type="range"
                        className="premium"
                        min="0"
                        max="1.0"
                        step="0.05"
                        value={node.cardBorderOpacity !== undefined ? node.cardBorderOpacity : 0.25}
                        onChange={(e) => updateNodeProp('cardBorderOpacity', parseFloat(e.target.value))}
                      />
                      <span className="value-badge">{Math.round((node.cardBorderOpacity !== undefined ? node.cardBorderOpacity : 0.25) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="section-separator" />
        </>
      )}

      {/* 4. Typography */}
      <SectionHeader icon={Type} title="Typography" open={openSections.typography} onToggle={() => toggleSection('typography')} />
      {openSections.typography && (
        <div className="section-content">
          {/* Show Text Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', paddingBottom: '8px', borderBottom: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.08)' }}>
            <div style={{
              width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
              background: node.cardHideText !== true ? 'rgba(0, 229, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)',
              border: `1px solid ${node.cardHideText !== true ? 'var(--accent-cyan)' : 'rgba(100, 100, 100, 0.3)'}`,
              position: 'relative', transition: 'all 0.2s ease'
            }}
              onClick={() => updateNodeProp('cardHideText', node.cardHideText === true ? false : true)}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '1px',
                left: node.cardHideText !== true ? '17px' : '1px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Show Text Content</span>
          </label>

          {node.cardHideText !== true && (
            <>
              {/* Title Section */}
              <div className="control-group">
                <label style={{ color: '#fff', letterSpacing: '0.8px' }}>Title Line</label>
                <input
                  type="text"
                  placeholder="Enter title..."
                  value={node.cardTitleText !== undefined ? node.cardTitleText : (node.label || '')}
                  onChange={(e) => {
                    updateNodeProp('cardTitleText', e.target.value);
                    updateNodeProp('label', e.target.value);
                  }}
                />
              </div>

              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Font Color</label>
                    <div className="color-picker-container">
                      <div className="color-swatch">
                        <input
                          type="color"
                          value={node.cardTextColor || '#FFFFFF'}
                          onChange={(e) => updateNodeProp('cardTextColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label>Font Size</label>
                    <input
                      type="number"
                      value={node.cardFontSize || 14}
                      onChange={(e) => updateNodeProp('cardFontSize', Math.max(8, parseInt(e.target.value) || 0))}
                    />
                  </div>
                </div>
              </div>

              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Weight</label>
                    <select
                      value={node.cardTitleWeight || '600'}
                      onChange={(e) => updateNodeProp('cardTitleWeight', e.target.value)}
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Regular (400)</option>
                      <option value="600">Semi-bold (600)</option>
                      <option value="800">Bold (800)</option>
                    </select>
                  </div>
                  <div>
                    <label>Alignment</label>
                    <select
                      value={node.cardTextAlign || 'center'}
                      onChange={(e) => updateNodeProp('cardTextAlign', e.target.value)}
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Letter Spacing</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="-2"
                        max="10"
                        value={node.cardTitleLetterSpacing !== undefined ? node.cardTitleLetterSpacing : 0}
                        onChange={(e) => updateNodeProp('cardTitleLetterSpacing', parseInt(e.target.value))}
                      />
                      <span className="value-badge">{node.cardTitleLetterSpacing !== undefined ? node.cardTitleLetterSpacing : 0}px</span>
                    </div>
                  </div>
                  <div>
                    <label>Line Height</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="1.0"
                        max="2.0"
                        step="0.1"
                        value={node.cardTitleLineHeight !== undefined ? node.cardTitleLineHeight : 1.2}
                        onChange={(e) => updateNodeProp('cardTitleLineHeight', parseFloat(e.target.value))}
                      />
                      <span className="value-badge">{node.cardTitleLineHeight !== undefined ? node.cardTitleLineHeight : 1.2}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtitle Section */}
              {(node.elementClass === 'card' || node.elementClass === 'text') && (
                <>
                  <div className="section-separator" style={{ margin: '4px 0' }} />
                  <div className="control-group">
                    <label style={{ color: '#fff', letterSpacing: '0.8px' }}>Subtitle Line</label>
                    <input
                      type="text"
                      placeholder="Enter subtitle..."
                      value={node.cardSubtext !== undefined ? node.cardSubtext : 'Interactive Panel'}
                      onChange={(e) => updateNodeProp('cardSubtext', e.target.value)}
                    />
                  </div>

                  <div className="control-group">
                    <div className="control-row">
                      <div>
                        <label>Sub Color</label>
                        <div className="color-picker-container">
                          <div className="color-swatch">
                            <input
                              type="color"
                              value={node.cardSubColor || '#C77DFF'}
                              onChange={(e) => updateNodeProp('cardSubColor', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label>Sub Size</label>
                        <input
                          type="number"
                          value={node.cardSubSize || 10}
                          onChange={(e) => updateNodeProp('cardSubSize', Math.max(6, parseInt(e.target.value) || 0))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="control-group">
                    <div className="control-row">
                      <div>
                        <label>Sub Weight</label>
                        <select
                          value={node.cardSubWeight || '400'}
                          onChange={(e) => updateNodeProp('cardSubWeight', e.target.value)}
                        >
                          <option value="300">Light (300)</option>
                          <option value="400">Regular (400)</option>
                          <option value="600">Semi-bold (600)</option>
                          <option value="800">Bold (800)</option>
                        </select>
                      </div>
                      <div>
                        <label>Sub Spacing</label>
                        <div className="control-row-inline">
                          <input
                            type="range"
                            className="premium"
                            min="-2"
                            max="10"
                            value={node.cardSubLetterSpacing !== undefined ? node.cardSubLetterSpacing : 0}
                            onChange={(e) => updateNodeProp('cardSubLetterSpacing', parseInt(e.target.value))}
                          />
                          <span className="value-badge">{node.cardSubLetterSpacing !== undefined ? node.cardSubLetterSpacing : 0}px</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="section-separator" />

      {/* 5. Shadow & Elevation */}
      {node.elementClass !== 'text' && (
        <>
          <SectionHeader icon={Zap} title="Shadow & Elevation" open={openSections.shadow} onToggle={() => toggleSection('shadow')} />
          {openSections.shadow && (
            <div className="section-content">
              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Shadow Color</label>
                    <div className="color-picker-container">
                      <div className="color-swatch">
                        <input
                          type="color"
                          value={node.cardShadowColor || '#9d4edd'}
                          onChange={(e) => updateNodeProp('cardShadowColor', e.target.value)}
                        />
                      </div>
                      <span className="color-hex">{(node.cardShadowColor || '#9d4edd').toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <label>Opacity</label>
                    <div className="control-row-inline" style={{ marginTop: '6px' }}>
                      <input
                        type="range"
                        className="premium"
                        min="0"
                        max="1.0"
                        step="0.05"
                        value={node.cardShadowOpacity !== undefined ? node.cardShadowOpacity : 0.4}
                        onChange={(e) => updateNodeProp('cardShadowOpacity', parseFloat(e.target.value))}
                      />
                      <span className="value-badge">{Math.round((node.cardShadowOpacity !== undefined ? node.cardShadowOpacity : 0.4) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Offset X</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="-20"
                        max="20"
                        value={node.cardShadowX !== undefined ? node.cardShadowX : 0}
                        onChange={(e) => updateNodeProp('cardShadowX', parseInt(e.target.value))}
                      />
                      <span className="value-badge">{node.cardShadowX !== undefined ? node.cardShadowX : 0}px</span>
                    </div>
                  </div>
                  <div>
                    <label>Offset Y</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="-20"
                        max="20"
                        value={node.cardShadowY !== undefined ? node.cardShadowY : 0}
                        onChange={(e) => updateNodeProp('cardShadowY', parseInt(e.target.value))}
                      />
                      <span className="value-badge">{node.cardShadowY !== undefined ? node.cardShadowY : 0}px</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="control-group">
                <div className="control-row">
                  <div>
                    <label>Blur Size</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="0"
                        max="50"
                        value={node.cardShadowBlur !== undefined ? node.cardShadowBlur : 15}
                        onChange={(e) => updateNodeProp('cardShadowBlur', parseInt(e.target.value))}
                      />
                      <span className="value-badge">{node.cardShadowBlur !== undefined ? node.cardShadowBlur : 15}px</span>
                    </div>
                  </div>
                  <div>
                    <label>Spread Size</label>
                    <div className="control-row-inline">
                      <input
                        type="range"
                        className="premium"
                        min="-10"
                        max="20"
                        value={node.cardShadowSpread !== undefined ? node.cardShadowSpread : 0}
                        onChange={(e) => updateNodeProp('cardShadowSpread', parseInt(e.target.value))}
                      />
                      <span className="value-badge">{node.cardShadowSpread !== undefined ? node.cardShadowSpread : 0}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="section-separator" />
        </>
      )}

      {/* 6. Physics Modifiers */}
      <SectionHeader icon={Zap} title="Physics" open={openSections.physics} onToggle={() => toggleSection('physics')} />
      {openSections.physics && (
        <div className="section-content">
          {[
            { key: 'collider', label: 'Solid Collider', desc: 'Deflects fluid flow', default: false },
            { key: 'burner', label: 'Thermal Burner', desc: 'Hot upward drafts', default: false },
            { key: 'dissolver', label: 'Liquid Dissolver', desc: 'Hover to melt', default: false },
            { key: 'cardEmitter', label: 'Card Emitter', desc: 'Spray fluid from card', default: false },
          ].map(({ key, label, desc }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 0' }}>
              <div style={{
                width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                background: (node[key] || false) ? 'rgba(0, 229, 255, 0.3)' : 'rgba(100, 100, 100, 0.2)',
                border: `1px solid ${(node[key] || false) ? 'var(--accent-cyan)' : 'rgba(100, 100, 100, 0.3)'}`,
                position: 'relative', transition: 'all 0.2s ease', flexShrink: 0
              }}
                onClick={() => updateNodeProp(key, !node[key])}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '1px',
                  left: (node[key] || false) ? '17px' : '1px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>{desc}</div>
              </div>
            </label>
          ))}

          {/* Card Emitter Sub-controls */}
          {node.cardEmitter && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="control-group">
                <label>Emitter Location</label>
                <select
                  value={node.emitterLocation || 'center'}
                  onChange={(e) => updateNodeProp('emitterLocation', e.target.value)}
                >
                  <option value="center">Card Center (Directional)</option>
                  <option value="top">Top Border (Upward)</option>
                  <option value="bottom">Bottom Border (Downward)</option>
                  <option value="left">Left Border (Leftward)</option>
                  <option value="right">Right Border (Rightward)</option>
                  <option value="outline">Full Outline (Outward)</option>
                </select>
              </div>

              <div className="control-group">
                <label>Spray Pattern</label>
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

              {(node.emitterLocation || 'center') === 'center' && (node.emitterMode || 'continuous') !== 'sweep' && (
                <div className="control-group">
                  <label>Emitter Angle</label>
                  <div className="control-row-inline">
                    <input
                      type="range"
                      className="premium"
                      min="0"
                      max="360"
                      value={node.emitterAngle || 0}
                      onChange={(e) => updateNodeProp('emitterAngle', parseFloat(e.target.value))}
                    />
                    <span className="value-badge">{node.emitterAngle || 0}°</span>
                  </div>
                </div>
              )}

              {node.emitterMode === 'sweep' && (node.emitterLocation || 'center') === 'center' && (
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

              <div className="control-group">
                <label>Emitter Force</label>
                <div className="control-row-inline">
                  <input
                    type="range"
                    className="premium"
                    min="10"
                    max="120"
                    value={node.emitterSpeed || 50}
                    onChange={(e) => updateNodeProp('emitterSpeed', parseFloat(e.target.value))}
                  />
                  <span className="value-badge">{node.emitterSpeed || 50}</span>
                </div>
              </div>

              <div className="control-group">
                <label>Emitter Radius</label>
                <div className="control-row-inline">
                  <input
                    type="range"
                    className="premium"
                    min="0.005"
                    max="0.05"
                    step="0.001"
                    value={node.emitterRadius || 0.02}
                    onChange={(e) => updateNodeProp('emitterRadius', parseFloat(e.target.value))}
                  />
                  <span className="value-badge">{Math.round((node.emitterRadius || 0.02) * 1000)}u</span>
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

              <div className="control-group">
                <label>Emitter Dye Color</label>
                <div className="color-picker-container">
                  <div className="color-swatch">
                    <input
                      type="color"
                      value={rgbToHex(node.emitterColor?.[0] || 0.0, node.emitterColor?.[1] || 0.94, node.emitterColor?.[2] || 1.0)}
                      onChange={(e) => updateNodeProp('emitterColor', hexToRgb(e.target.value))}
                    />
                  </div>
                  <span className="color-hex">
                    {rgbToHex(node.emitterColor?.[0] || 0.0, node.emitterColor?.[1] || 0.94, node.emitterColor?.[2] || 1.0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="section-separator" />

      {/* Delete Button */}
      <button className="btn-delete-premium" onClick={handleDeleteNode}>
        <Trash2 size={13} /> Delete Card
      </button>
    </div>
  );
}
