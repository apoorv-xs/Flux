import { useState, useEffect } from 'react';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import Compiler from './components/Compiler';
import {
  Waves,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Code,
  MousePointer,
  Radio,
  Wind,
  Orbit,
  Square,
  Hand,
  Minus,
  Plus
} from 'lucide-react';

export default function App() {
  // Pre-seed some objects on load to showcase immediate fluid dynamics beauty
  const [nodes, setNodes] = useState([
    {
      id: 'emitter-1',
      type: 'emitter',
      x: 100,
      y: 300,
      angle: 0,
      speed: 70,
      radius: 0.018,
      color: [0.61, 0.3, 1.0] // Neon ultraviolet
    },
    {
      id: 'obstacle-1',
      type: 'obstacle',
      x: 350,
      y: 180,
      width: 600,
      height: 300,
      cardBorderRadius: 16,
      label: 'FLUX STUDIO',
      cardTitleText: 'FLUX STUDIO',
      cardSubtext: 'Spatial Fluid Dynamics Playground',
      elementClass: 'card',
      cardBgType: 'gradient',
      cardBgColor1: '#240046',
      cardBgColor2: '#10002B',
      cardBgAngle: 135,
      cardBgOpacity: 0.45,
      cardBlur: 20,
      cardBorderWidth: 1.5,
      cardBorderStyle: 'solid',
      cardBorderColor: '#00E5FF',
      cardBorderOpacity: 0.3,
      cardTextColor: '#FFFFFF',
      cardFontSize: 16,
      cardTitleWeight: '800',
      cardTitleLetterSpacing: 2,
      cardSubColor: '#C77DFF',
      cardSubSize: 10,
      cardSubWeight: '500',
      cardSubLetterSpacing: 1,
      cardShadowColor: '#00E5FF',
      cardShadowOpacity: 0.25,
      cardShadowX: 0,
      cardShadowY: 10,
      cardShadowBlur: 25,
      cardShadowSpread: 0,
      collider: false,
      burner: false,
      dissolver: false,
      dissolveLevel: 0
    }
  ]);

  // Editor states
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isPlayMode, setIsPlayMode] = useState(true);
  const [renderMode, setRenderMode] = useState(0); // 0: Dye, 1: Velocity, 2: Obstacles

  // Fluid math parameters
  const [viscosity, setViscosity] = useState(0.8);
  const [dissipation, setDissipation] = useState(0.992); // Dye dissipation (controls fade speed)
  const [timeStep, setTimeStep] = useState(0.016);
  const [smokeColor, setSmokeColor] = useState([0.0, 0.94, 1.0]); // Cyan cursor paint

  // Interactive UI layout states
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // select, pan, add-*

  // Canvas coordinates offsets (initially centered)
  const [zoom, setZoom] = useState(0.85);
  const [panOffset, setPanOffset] = useState({ x: 50, y: 50 });

  // Key hooks (Delete or Backspace to remove nodes, V/H for tool switching)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore hotkeys if typing in input fields
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setNodes(prev => prev.filter(node => node.id !== selectedNodeId));
          setSelectedNodeId(null);
        }
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'h') {
        setActiveTool('pan');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('add-emitter');
      } else if (e.key.toLowerCase() === 'o') {
        setActiveTool('add-vortex');
      } else if (e.key.toLowerCase() === 'w') {
        setActiveTool('add-tunnel');
      } else if (e.key.toLowerCase() === 's') {
        setActiveTool('add-obstacle');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  // Sync smokeColor to CSS custom properties for dynamic theming
  useEffect(() => {
    const r = Math.round(smokeColor[0] * 255);
    const g = Math.round(smokeColor[1] * 255);
    const b = Math.round(smokeColor[2] * 255);
    const root = document.documentElement;
    root.style.setProperty('--accent-r', r);
    root.style.setProperty('--accent-g', g);
    root.style.setProperty('--accent-b', b);
    root.style.setProperty('--accent-violet', `rgb(${r}, ${g}, ${b})`);
    // Text colors: brightened version for labels/titles, dimmed for muted
    const brighten = (v, amount) => Math.min(255, Math.round(v * amount));
    const dim = (v, amount) => Math.max(0, Math.round(v * amount));
    root.style.setProperty('--text-secondary', `rgb(${brighten(r, 1.15)}, ${brighten(g, 1.15)}, ${brighten(b, 1.15)})`);
    root.style.setProperty('--text-muted', `rgb(${dim(r, 0.55)}, ${dim(g, 0.55)}, ${dim(b, 0.55)})`);
  }, [smokeColor]);

  // Reset simulation trigger
  const handleResetSimulation = () => {
    // Clear WebGL buffers and reset node states
    window.dispatchEvent(new CustomEvent('flux-clear-dye'));
  };

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-color)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)'
      }}
    >
      {/* 1. Full Screen Interactive WebGL / SVG / DOM Canvas */}
      <Canvas
        nodes={nodes}
        setNodes={setNodes}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
        isPlayMode={isPlayMode}
        renderMode={renderMode}
        viscosity={viscosity}
        dissipation={dissipation}
        timeStep={timeStep}
        smokeColor={smokeColor}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        zoom={zoom}
        setZoom={setZoom}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
      />

      {/* 2. Floating Top Header */}
      <header
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          height: '54px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px',
          zIndex: 10,
          border: '1px solid var(--panel-border)',
          pointerEvents: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Waves size={18} style={{ color: 'var(--accent-violet)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '2px', color: '#fff' }}>
            FLUX <span style={{ color: 'var(--text-secondary)' }}>// SPATIAL FLUID DYNAMICS STUDIO</span>
          </span>
        </div>

        {/* System Operations toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn-neon ${isPlayMode ? '' : 'secondary'}`}
            style={{ padding: '6px 12px', fontSize: '11px' }}
            onClick={() => setIsPlayMode(!isPlayMode)}
          >
            {isPlayMode ? <Pause size={10} /> : <Play size={10} />}
            {isPlayMode ? 'Pause Physics' : 'Resume Physics'}
          </button>

          <button
            className="btn-neon secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
            onClick={handleResetSimulation}
          >
            <RotateCcw size={10} />
            Reset Fluid
          </button>

          <div style={{ height: '16px', width: '1px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' }} />

          <button
            className={`btn-neon ${isCompilerOpen ? '' : 'secondary'}`}
            style={{ padding: '6px 12px', fontSize: '11px' }}
            onClick={() => setIsCompilerOpen(!isCompilerOpen)}
          >
            <Code size={11} />
            Export Code
          </button>

          <button
            className={`btn-neon ${isInspectorOpen ? '' : 'secondary'}`}
            style={{ padding: '6px 12px', fontSize: '11px' }}
            onClick={() => setIsInspectorOpen(!isInspectorOpen)}
          >
            <Settings size={11} />
            Inspector
          </button>
        </div>
      </header>

      {/* 3. Floating Left Toolbar */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '94px',
          left: '20px',
          width: '54px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 0',
          zIndex: 10,
          pointerEvents: 'auto'
        }}
      >
        <button
          className={`btn-neon secondary ${activeTool === 'select' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => { setActiveTool('select'); setSelectedNodeId(null); }}
          title="Select & Move Tool (V)"
        >
          <MousePointer size={15} />
        </button>

        <button
          className={`btn-neon secondary ${activeTool === 'pan' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => { setActiveTool('pan'); setSelectedNodeId(null); }}
          title="Grab & Pan Canvas (H)"
        >
          <Hand size={15} />
        </button>

        <div style={{ width: '20px', height: '1px', background: 'rgba(157,78,221,0.15)', margin: '4px 0' }} />

        <button
          className={`btn-neon secondary ${activeTool === 'add-emitter' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => setActiveTool('add-emitter')}
          title="Place Fluid Emitter (E)"
        >
          <Radio size={15} />
        </button>

        <button
          className={`btn-neon secondary ${activeTool === 'add-vortex' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => setActiveTool('add-vortex')}
          title="Place Gravity Vortex (O)"
        >
          <Orbit size={15} />
        </button>

        <button
          className={`btn-neon secondary ${activeTool === 'add-tunnel' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => setActiveTool('add-tunnel')}
          title="Place Wind Tunnel (W)"
        >
          <Wind size={15} />
        </button>

        <button
          className={`btn-neon secondary ${activeTool === 'add-obstacle' ? 'active' : ''}`}
          style={{ width: '38px', height: '38px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}
          onClick={() => setActiveTool('add-obstacle')}
          title="Place UI Obstacle Card (S)"
        >
          <Square size={15} />
        </button>
      </div>

      {/* 4. Collapsible Right Inspector Sidebar */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: '94px',
          right: '20px',
          bottom: isCompilerOpen ? '320px' : '20px',
          width: '320px',
          zIndex: 10,
          pointerEvents: 'auto',
          transform: isInspectorOpen ? 'translateX(0)' : 'translateX(360px)',
          opacity: isInspectorOpen ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Inspector
          nodes={nodes}
          setNodes={setNodes}
          selectedNodeId={selectedNodeId}
          setSelectedNodeId={setSelectedNodeId}
          isPlayMode={isPlayMode}
          setIsPlayMode={setIsPlayMode}
          renderMode={renderMode}
          setRenderMode={setRenderMode}
          viscosity={viscosity}
          setViscosity={setViscosity}
          dissipation={dissipation}
          setDissipation={setDissipation}
          timeStep={timeStep}
          setTimeStep={setTimeStep}
          smokeColor={smokeColor}
          setSmokeColor={setSmokeColor}
          onResetSimulation={handleResetSimulation}
        />
      </div>

      {/* 5. Collapsible Bottom Compiler Drawer */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          left: '20px',
          right: isInspectorOpen ? '360px' : '20px',
          bottom: '20px',
          height: '280px',
          zIndex: 10,
          pointerEvents: 'auto',
          transform: isCompilerOpen ? 'translateY(0)' : 'translateY(320px)',
          opacity: isCompilerOpen ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Compiler
          nodes={nodes}
          viscosity={viscosity}
          dissipation={dissipation}
          timeStep={timeStep}
          smokeColor={smokeColor}
        />
      </div>
      {/* 6. Floating Zoom Bar in the Bottom Left */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: isCompilerOpen ? '310px' : '20px',
          left: '20px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 12px',
          zIndex: 15,
          pointerEvents: 'auto',
          transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <button
          className="btn-neon secondary"
          style={{ padding: '4px', width: '22px', height: '22px', justifyContent: 'center', borderRadius: '6px' }}
          onClick={() => setZoom(prev => Math.max(0.15, prev - 0.15))}
          title="Zoom Out"
        >
          <Minus size={11} />
        </button>

        <input
          type="range"
          min="0.15"
          max="4.0"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ width: '80px', margin: 0, height: '4px' }}
        />

        <button
          className="btn-neon secondary"
          style={{ padding: '4px', width: '22px', height: '22px', justifyContent: 'center', borderRadius: '6px' }}
          onClick={() => setZoom(prev => Math.min(4.0, prev + 0.15))}
          title="Zoom In"
        >
          <Plus size={11} />
        </button>

        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', minWidth: '36px', textAlign: 'right', color: 'var(--text-secondary)' }}>
          {Math.round(zoom * 100)}%
        </span>

        <div style={{ width: '1px', height: '14px', background: 'rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.15)' }} />

        <button
          className="btn-neon secondary"
          style={{ padding: '2px 8px', fontSize: '9px', borderRadius: '6px', height: '22px' }}
          onClick={() => { setZoom(0.85); setPanOffset({ x: 50, y: 50 }); }}
          title="Reset View"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
