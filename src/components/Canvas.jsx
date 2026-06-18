import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { FluidSolver } from '../utils/fluidSolver';
import {
  drawObstacleMask,
  splatEmitter,
  splatWindTunnel,
  splatVortex,
  splatBurner,
  splatCardEmitter,
  splatMouseDrag
} from '../utils/splatFunctions';
import CanvasOverlay from './CanvasOverlay';
import CanvasCards from './CanvasCards';

export default function Canvas({
  nodes,
  setNodes,
  selectedNodeId,
  setSelectedNodeId,
  isPlayMode,
  renderMode,
  viscosity,
  dissipation,
  timeStep,
  smokeColor,
  activeTool,
  setActiveTool,
  zoom,
  setZoom,
  panOffset,
  setPanOffset
}) {
  const containerRef = useRef(null);
  const webglCanvasRef = useRef(null);
  const obstacleCanvasRef = useRef(null);

  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isResizingNode, setIsResizingNode] = useState(false);
  const [isRotatingNode, setIsRotatingNode] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);

  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0, nodeW: 0, nodeH: 0 });
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const solverRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, isDown: false, isMoving: false });

  // Mirror props into refs so the animation loop never re-mounts.
  // The loop reads from these instead of closures over props.
  const nodesRef = useRef(nodes);
  const isPlayModeRef = useRef(isPlayMode);
  const renderModeRef = useRef(renderMode);
  const viscosityRef = useRef(viscosity);
  const dissipationRef = useRef(dissipation);
  const timeStepRef = useRef(timeStep);
  const smokeColorRef = useRef(smokeColor);
  const activeToolRef = useRef(activeTool);
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);

  // Sync refs every render
  useLayoutEffect(() => {
    nodesRef.current = nodes;
    isPlayModeRef.current = isPlayMode;
    renderModeRef.current = renderMode;
    viscosityRef.current = viscosity;
    dissipationRef.current = dissipation;
    timeStepRef.current = timeStep;
    smokeColorRef.current = smokeColor;
    activeToolRef.current = activeTool;
    zoomRef.current = zoom;
    panOffsetRef.current = panOffset;
  });

  const toScreen = (cx, cy) => ({
    x: cx * zoom + panOffset.x,
    y: cy * zoom + panOffset.y
  });

  const toCanvas = (sx, sy) => ({
    x: (sx - panOffset.x) / zoom,
    y: (sy - panOffset.y) / zoom
  });

  // Initial WebGL Context setup
  useEffect(() => {
    const glCanvas = webglCanvasRef.current;
    const gl = glCanvas.getContext('webgl2', { alpha: false, antialias: true, depth: false });
    if (!gl) {
      alert("WebGL2 is not supported by your browser. FLUX requires WebGL2.");
      return;
    }

    const solver = new FluidSolver(gl, 256, 256);
    solverRef.current = solver;

    const handleClearDye = () => {
      if (solverRef.current) {
        solverRef.current.clear();
      }
    };
    window.addEventListener('flux-clear-dye', handleClearDye);

    const handleResize = () => {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      glCanvas.width = w;
      glCanvas.height = h;

      const obstacleCanvas = obstacleCanvasRef.current;
      obstacleCanvas.width = 512;
      obstacleCanvas.height = Math.floor(512 * (h / w));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('flux-clear-dye', handleClearDye);
      if (solverRef.current) {
        solverRef.current.destroy();
      }
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // Wheel zoom handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      setZoom(prevZoom => {
        const zoomFactor = 1.15;
        let newZoom = e.deltaY < 0 ? prevZoom * zoomFactor : prevZoom / zoomFactor;
        newZoom = Math.max(0.15, Math.min(4.0, newZoom));

        setPanOffset(prevPan => {
          const newPanX = mx - (mx - prevPan.x) * (newZoom / prevZoom);
          const newPanY = my - (my - prevPan.y) * (newZoom / prevZoom);
          return { x: newPanX, y: newPanY };
        });

        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [setZoom, setPanOffset]);

  // Animation loop — runs once on mount, reads all hot-path values from refs.
  // No dependency array means this never tears down and rebuilds.
  useEffect(() => {
    const update = () => {
      const solver = solverRef.current;
      const glCanvas = webglCanvasRef.current;
      const obstacleCanvas = obstacleCanvasRef.current;

      if (!solver || !glCanvas || !obstacleCanvas) {
        animationFrameIdRef.current = requestAnimationFrame(update);
        return;
      }

      const aspect = glCanvas.width / glCanvas.height;
      const currentNodes = nodesRef.current;
      const currentZoom = zoomRef.current;
      const currentPanOffset = panOffsetRef.current;

      const currentToScreen = (cx, cy) => ({
        x: cx * currentZoom + currentPanOffset.x,
        y: cy * currentZoom + currentPanOffset.y
      });

      // 1. Draw obstacles to 2D offscreen canvas mask
      drawObstacleMask(currentNodes, obstacleCanvas, glCanvas, currentToScreen, currentZoom);
      solver.updateObstacles(obstacleCanvas);

      // 2. Continuous Splats (Emitters, Wind Tunnels, Vortexes, Hover Effects)
      if (isPlayModeRef.current) {
        currentNodes.forEach(node => {
          if (node.type === 'emitter') {
            splatEmitter(solver, node, glCanvas, currentToScreen, aspect);
          } else if (node.type === 'windTunnel') {
            splatWindTunnel(solver, node, glCanvas, currentToScreen, aspect);
          } else if (node.type === 'vortex') {
            splatVortex(solver, node, glCanvas, currentToScreen, aspect);
          } else if (node.type === 'obstacle' && node.burner) {
            splatBurner(solver, node, glCanvas, currentToScreen, aspect);
          }

          if (node.type === 'obstacle' && node.cardEmitter) {
            splatCardEmitter(solver, node, glCanvas, currentToScreen, aspect);
          }
        });
      }

      // 3. User Mouse Interaction splats
      const mouse = mouseRef.current;
      if (mouse.isDown && mouse.isMoving) {
        splatMouseDrag(solver, mouse, glCanvas, activeToolRef.current, smokeColorRef.current, aspect);
      }

      // 4. Update the fluid simulation step
      if (isPlayModeRef.current) {
        solver.step(timeStepRef.current, viscosityRef.current, dissipationRef.current, 24);
      }

      // 5. Render WebGL context to screen
      solver.render(glCanvas.width, glCanvas.height, renderModeRef.current);

      animationFrameIdRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []); // Never re-mount — reads from refs

  // --- Mouse / Interaction Handlers ---

  const handleMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y
      };
      return;
    }

    if (activeTool !== 'select') {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const canvasPos = toCanvas(clickX, clickY);

      let newNode = {
        id: `node-${Date.now()}`,
        x: canvasPos.x,
        y: canvasPos.y
      };

      if (activeTool === 'add-emitter') {
        newNode = {
          ...newNode,
          type: 'emitter',
          angle: 45,
          speed: 60,
          radius: 0.015,
          color: [0.6, 0.1, 1.0]
        };
      } else if (activeTool === 'add-vortex') {
        newNode = {
          ...newNode,
          type: 'vortex',
          radius: 80,
          strength: 40
        };
      } else if (activeTool === 'add-tunnel') {
        newNode = {
          ...newNode,
          type: 'windTunnel',
          width: 160,
          height: 80,
          angle: 0,
          speed: 50
        };
      } else if (activeTool === 'add-obstacle') {
        newNode = {
          ...newNode,
          type: 'obstacle',
          width: 150,
          height: 60,
          borderRadius: 8,
          label: 'Interactable Button',
          elementClass: 'button',
          collider: false,
          burner: false,
          dissolver: false,
          dissolveLevel: 0
        };
      }

      setNodes(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
      setActiveTool('select');
      return;
    }

    setSelectedNodeId(null);

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.isDown = true;
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
    mouseRef.current.px = mouseRef.current.x;
    mouseRef.current.py = mouseRef.current.y;
  };

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy
      });
      return;
    }

    if (isRotatingNode && draggedNodeId) {
      const canvasPos = toCanvas(mx, my);
      const dx = canvasPos.x - dragStartRef.current.centerX;
      const dy = canvasPos.y - dragStartRef.current.centerY;
      let angleRad = Math.atan2(dy, dx);
      let angleDeg = (angleRad * 180) / Math.PI;
      angleDeg = Math.round((angleDeg + 360) % 360);

      setNodes(prev =>
        prev.map(node => {
          if (node.id === draggedNodeId) {
            if (node.type === 'obstacle') {
              return { ...node, emitterAngle: angleDeg };
            } else {
              return { ...node, angle: angleDeg };
            }
          }
          return node;
        })
      );
      return;
    }

    if (isDraggingNode && draggedNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;

      setNodes(prev =>
        prev.map(node =>
          node.id === draggedNodeId
            ? { ...node, x: dragStartRef.current.nodeX + dx, y: dragStartRef.current.nodeY + dy }
            : node
        )
      );
      return;
    }

    if (isResizingNode && draggedNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;

      setNodes(prev =>
        prev.map(node =>
          node.id === draggedNodeId
            ? {
                ...node,
                width: Math.max(50, dragStartRef.current.nodeW + dx),
                height: Math.max(30, dragStartRef.current.nodeH + dy)
              }
            : node
        )
      );
      return;
    }

    mouseRef.current.x = mx;
    mouseRef.current.y = my;
    mouseRef.current.isMoving = true;

    // Dissolver hover erosion
    if (isPlayMode) {
      const canvasPos = toCanvas(mx, my);
      nodes.forEach(node => {
        if (node.type === 'obstacle' && node.dissolver) {
          const inside =
            canvasPos.x >= node.x &&
            canvasPos.x <= node.x + node.width &&
            canvasPos.y >= node.y &&
            canvasPos.y <= node.y + node.height;

          if (inside && (!node.dissolveLevel || node.dissolveLevel < 1.0)) {
            setNodes(prev =>
              prev.map(n =>
                n.id === node.id
                  ? { ...n, dissolveLevel: Math.min(1.0, (n.dissolveLevel || 0) + 0.05) }
                  : n
              )
            );

            const aspect = rect.width / rect.height;
            const normX = mx / rect.width;
            const normY = 1.0 - (my / rect.height);
            solverRef.current.splat(solverRef.current.dye, normX, normY, [0.02, 0.0, 0.045], 0.015, aspect);
            solverRef.current.splat(solverRef.current.velocity, normX, normY, [0, -0.05, 0], 0.015, aspect);
          }
        }
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingNode(false);
    setIsResizingNode(false);
    setIsRotatingNode(false);
    setDraggedNodeId(null);
    mouseRef.current.isDown = false;
  };

  const startDragNode = (e, node) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedNodeId(node.id);
    setIsDraggingNode(true);
    setDraggedNodeId(node.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y
    };
  };

  const startResizeNode = (e, node) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingNode(true);
    setDraggedNodeId(node.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeW: node.width,
      nodeH: node.height
    };
  };

  const startRotateNode = (e, node) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotatingNode(true);
    setDraggedNodeId(node.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      centerX: node.type === 'emitter' ? node.x : node.x + (node.width || 0) / 2,
      centerY: node.type === 'emitter' ? node.y : node.y + (node.height || 0) / 2
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        outline: 'none',
        cursor: activeTool === 'pan'
          ? (isPanning ? 'grabbing' : 'grab')
          : (activeTool === 'select' ? 'default' : 'crosshair')
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="blueprint-grid"
    >
      {/* WebGL Canvas */}
      <canvas
        ref={webglCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Hidden Obstacle Mask Canvas */}
      <canvas
        ref={obstacleCanvasRef}
        style={{ display: 'none' }}
      />

      {/* SVG Vector Overlay */}
      <CanvasOverlay
        nodes={nodes}
        zoom={zoom}
        toScreen={toScreen}
        startRotateNode={startRotateNode}
      />

      {/* DOM Cards & Gizmo Layer */}
      <CanvasCards
        nodes={nodes}
        zoom={zoom}
        selectedNodeId={selectedNodeId}
        activeTool={activeTool}
        toScreen={toScreen}
        startDragNode={startDragNode}
        startResizeNode={startResizeNode}
      />
    </div>
  );
}
