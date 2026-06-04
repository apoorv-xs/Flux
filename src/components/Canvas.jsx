import React, { useRef, useEffect, useState } from 'react';
import { FluidSolver } from '../utils/fluidSolver';
import { Radio, Wind, Orbit } from 'lucide-react';
import { hexToRgbaStr } from '../utils/color';


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
  
  // Keep mouse position for continuous splats
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, isDown: false, isMoving: false });

  // Get screen coordinates from canvas coordinates
  const toScreen = (cx, cy) => {
    return {
      x: cx * zoom + panOffset.x,
      y: cy * zoom + panOffset.y
    };
  };

  // Get canvas coordinates from screen coordinates
  const toCanvas = (sx, sy) => {
    return {
      x: (sx - panOffset.x) / zoom,
      y: (sy - panOffset.y) / zoom
    };
  };

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

    // Clear simulation listener
    const handleClearDye = () => {
      if (solverRef.current) {
        solverRef.current.clear();
      }
    };
    window.addEventListener('flux-clear-dye', handleClearDye);

    // Resize canvas viewport
    const handleResize = () => {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      glCanvas.width = w;
      glCanvas.height = h;
      
      // Resize obstacle mask canvas too (downscaled to 256x256 or proportional to aspect)
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

  // Manual non-passive wheel event listener to block browser-default viewport zoom
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
  }, []);

  // Update solver physics loop
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

      // 1. Draw obstacles to 2D offscreen canvas mask
      const ctx = obstacleCanvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, obstacleCanvas.width, obstacleCanvas.height);

      ctx.fillStyle = '#ffffff';

      // Draw all nodes of type 'obstacle'
      nodes.forEach(node => {
        if (node.type === 'obstacle' && node.collider !== false) {
          // Check if dissolver is fully eroded
          const erode = node.dissolveLevel || 0;
          if (erode >= 0.99) return;

          // Convert node bounds to screen coords
          const screenPos = toScreen(node.x, node.y);
          const screenW = node.width * zoom;
          const screenH = node.height * zoom;

          // Scale to obstacle canvas coordinates
          const scaleX = obstacleCanvas.width / glCanvas.width;
          const scaleY = obstacleCanvas.height / glCanvas.height;

          const ox = screenPos.x * scaleX;
          const oy = screenPos.y * scaleY;
          const ow = screenW * scaleX;
          const oh = screenH * scaleY;
          const r = (node.borderRadius || 12) * zoom * scaleX * (1 - erode); // radius shrinks as it erodes

          if (ow > 0 && oh > 0) {
            ctx.beginPath();
            ctx.roundRect(ox, oy, ow, oh, Math.max(0, r));
            ctx.fill();
          }
        }
      });

      solver.updateObstacles(obstacleCanvas);

      // 2. Continuous Splats (Emitters, Wind Tunnels, Vortexes, Hover Effects)
      if (isPlayMode) {
        nodes.forEach(node => {
          // Convert position to normalized screen coords (0 to 1) for WebGL
          const sPos = toScreen(node.x, node.y);
          const normX = sPos.x / glCanvas.width;
          const normY = 1.0 - (sPos.y / glCanvas.height); // WebGL coordinates start at bottom-left

          if (node.type === 'emitter') {
            const nowSec = Date.now() / 1000;
            let activeAngle = node.angle || 0;
            let multiplier = 1.0;

            if (node.emitterMode === 'pulse') {
              multiplier = Math.max(0.0, Math.sin(nowSec * 2 * Math.PI * (node.emitterPulseFreq || 2.0)));
            } else if (node.emitterMode === 'sweep') {
              activeAngle = (node.angle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
            }

            if (multiplier > 0.01) {
              const angleRad = (activeAngle * Math.PI) / 180;
              const forceStrength = (node.speed || 50) * 0.003 * multiplier;
              const vx = Math.cos(angleRad) * forceStrength;
              const vy = Math.sin(angleRad) * forceStrength;
              const rad = node.radius || 0.015;

              // Inject velocity
              solver.splat(solver.velocity, normX, normY, [vx, vy, 0], rad, aspect);
              // Inject dye (scaled down to prevent blowout)
              const col = node.color || [1, 0, 1];
              const density = node.emitterDensity !== undefined ? node.emitterDensity : 1.0;
              const scaledCol = col.map(c => c * 0.05 * multiplier * density);
              solver.splat(solver.dye, normX, normY, scaledCol, rad, aspect);
            }
          }

          else if (node.type === 'windTunnel') {
            // Wind tunnel: inject continuous velocity along a grid of 3 points inside bounds
            const w = node.width;
            const h = node.height;
            const angleRad = (node.angle * Math.PI) / 180;
            const forceStrength = (node.speed || 50) * 0.0015;
            const vx = Math.cos(angleRad) * forceStrength;
            const vy = Math.sin(angleRad) * forceStrength;

            // Compute center points along the length
            const steps = 3;
            for (let i = 0; i < steps; i++) {
              const fraction = (i + 0.5) / steps - 0.5; // -0.33, 0, 0.33
              // Find offset in wind direction
              const offsetCX = node.x + w/2 + Math.cos(angleRad) * (w * fraction);
              const offsetCY = node.y + h/2 + Math.sin(angleRad) * (h * fraction);

              const sPoint = toScreen(offsetCX, offsetCY);
              const nX = sPoint.x / glCanvas.width;
              const nY = 1.0 - (sPoint.y / glCanvas.height);
              
              if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
                solver.splat(solver.velocity, nX, nY, [vx, vy, 0], 0.03, aspect);
              }
            }
          }

          else if (node.type === 'vortex') {
            // Vortex whirlpool: inject velocity tangentially at 6 points on a ring
            const numPoints = 6;
            const str = (node.strength || 30) * 0.002;
            const r = node.radius || 80;

            for (let i = 0; i < numPoints; i++) {
              const theta = (i / numPoints) * Math.PI * 2;
              const px = node.x + Math.cos(theta) * r;
              const py = node.y + Math.sin(theta) * r;

              const sPoint = toScreen(px, py);
              const nX = sPoint.x / glCanvas.width;
              const nY = 1.0 - (sPoint.y / glCanvas.height);

              // Tangential velocity vector
              const vx = -Math.sin(theta) * str;
              const vy = Math.cos(theta) * str;

              if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
                solver.splat(solver.velocity, nX, nY, [vx, vy, 0], 0.015, aspect);
              }
            }
          }

          else if (node.type === 'obstacle' && node.burner) {
            // Burner obstacle: inject warm upward velocity along its top border
            const bx = node.x + node.width / 2;
            const by = node.y; // top edge
            const sPoint = toScreen(bx, by);
            const nX = sPoint.x / glCanvas.width;
            const nY = 1.0 - (sPoint.y / glCanvas.height);

            const heatForce = 0.05; // Upward velocity
            solver.splat(solver.velocity, nX, nY, [0, heatForce, 0], 0.04, aspect);
            // Splat high temperature color (neon orange/pink, scaled down to prevent blowout)
            solver.splat(solver.dye, nX, nY, [0.04, 0.004, 0.016], 0.03, aspect);
          }

          if (node.type === 'obstacle' && node.cardEmitter) {
            const nowSec = Date.now() / 1000;
            let multiplier = 1.0;
            let activeAngle = node.emitterAngle || 0;

            if (node.emitterMode === 'pulse') {
              multiplier = Math.max(0.0, Math.sin(nowSec * 2 * Math.PI * (node.emitterPulseFreq || 2.0)));
            } else if (node.emitterMode === 'sweep') {
              activeAngle = (node.emitterAngle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
            }

            const density = node.emitterDensity !== undefined ? node.emitterDensity : 1.0;
            const rad = node.emitterRadius || 0.02;
            const forceStrength = (node.emitterSpeed || 50) * 0.003 * multiplier;
            const col = node.emitterColor || [0.0, 0.94, 1.0];
            const scaledCol = col.map(c => c * 0.05 * multiplier * density);

            const loc = node.emitterLocation || 'center';

            if (multiplier > 0.01) {
              if (loc === 'center') {
                const bx = node.x + node.width / 2;
                const by = node.y + node.height / 2;
                const sPoint = toScreen(bx, by);
                const nX = sPoint.x / glCanvas.width;
                const nY = 1.0 - (sPoint.y / glCanvas.height);

                const angleRad = (activeAngle * Math.PI) / 180;
                const vx = Math.cos(angleRad) * forceStrength;
                const vy = Math.sin(angleRad) * forceStrength;

                solver.splat(solver.velocity, nX, nY, [vx, vy, 0], rad, aspect);
                solver.splat(solver.dye, nX, nY, scaledCol, rad, aspect);
              } else {
                // Border spraying logic
                const points = [];
                const x0 = node.x;
                const x1 = node.x + node.width;
                const y0 = node.y;
                const y1 = node.y + node.height;
                const numPoints = 5;

                const addBorderPoints = (borderSide) => {
                  for (let i = 0; i < numPoints; i++) {
                    const t = (i + 0.5) / numPoints;
                    let px, py, vx, vy;
                    if (borderSide === 'top') {
                      px = x0 + t * (x1 - x0);
                      py = y0;
                      vx = 0;
                      vy = forceStrength; // Upward in WebGL coordinates
                    } else if (borderSide === 'bottom') {
                      px = x0 + t * (x1 - x0);
                      py = y1;
                      vx = 0;
                      vy = -forceStrength; // Downward
                    } else if (borderSide === 'left') {
                      px = x0;
                      py = y0 + t * (y1 - y0);
                      vx = -forceStrength; // Leftward
                      vy = 0;
                    } else if (borderSide === 'right') {
                      px = x1;
                      py = y0 + t * (y1 - y0);
                      vx = forceStrength; // Rightward
                      vy = 0;
                    }
                    points.push({ px, py, vx, vy });
                  }
                };

                if (loc === 'top') {
                  addBorderPoints('top');
                } else if (loc === 'bottom') {
                  addBorderPoints('bottom');
                } else if (loc === 'left') {
                  addBorderPoints('left');
                } else if (loc === 'right') {
                  addBorderPoints('right');
                } else if (loc === 'outline') {
                  addBorderPoints('top');
                  addBorderPoints('bottom');
                  addBorderPoints('left');
                  addBorderPoints('right');
                }

                points.forEach(pt => {
                  const sPoint = toScreen(pt.px, pt.py);
                  const nX = sPoint.x / glCanvas.width;
                  const nY = 1.0 - (sPoint.y / glCanvas.height);
                  if (nX >= 0 && nX <= 1 && nY >= 0 && nY <= 1) {
                    solver.splat(solver.velocity, nX, nY, [pt.vx, pt.vy, 0], rad, aspect);
                    const borderDyeScale = 0.4;
                    const ptCol = scaledCol.map(c => c * borderDyeScale);
                    solver.splat(solver.dye, nX, nY, ptCol, rad, aspect);
                  }
                });
              }
            }
          }
        });
      }

      // 3. User Mouse Interaction splats
      const mouse = mouseRef.current;
      if (mouse.isDown && mouse.isMoving) {
        const mx = mouse.x / glCanvas.width;
        const my = 1.0 - (mouse.y / glCanvas.height);
        
        // Calculate velocity vector
        const forceX = (mouse.x - mouse.px) * 0.005;
        const forceY = -(mouse.y - mouse.py) * 0.005; // Invert screen Y delta
        
        // Splat mouse drag force
        solver.splat(solver.velocity, mx, my, [forceX, forceY, 0], 0.01, aspect);

        // Splat mouse colors (scaled down to prevent blowout)
        if (activeTool === 'select') {
          const scaledMouseCol = smokeColor.map(c => c * 0.06);
          solver.splat(solver.dye, mx, my, scaledMouseCol, 0.012, aspect);
        }

        // Store old coordinates for next step calculation
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        mouse.isMoving = false;
      }

      // 4. Update the fluid simulation step
      if (isPlayMode) {
        solver.step(timeStep, viscosity, dissipation, 24); // 24 Jacobi iterations
      }

      // 5. Render WebGL context to screen
      solver.render(glCanvas.width, glCanvas.height, renderMode);

      animationFrameIdRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [nodes, isPlayMode, renderMode, viscosity, dissipation, timeStep, smokeColor, activeTool, zoom, panOffset]);

  // Pointer Handlers for Canvas (Panning / Placing / Hover erosion)
  const handleMouseDown = (e) => {
    if (e.button === 1 || activeTool === 'pan') {
      // Middle click or Pan tool: start panning
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
      // Placer Tool: spawn selected node type
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
          color: [0.6, 0.1, 1.0] // violet default
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
          burner: false,
          dissolver: false,
          dissolveLevel: 0
        };
      }

      setNodes(prev => [...prev, newNode]);
      setSelectedNodeId(newNode.id);
      setActiveTool('select'); // return to select
      return;
    }

    // Default select tool actions: click canvas to deselect
    setSelectedNodeId(null);
    
    // Mouse splat trigger
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

    // Handle Panning
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy
      });
      return;
    }

    // Handle Rotating Node
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

    // Handle Dragging Node
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

    // Handle Resizing Node
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

    // Update mouse for WebGL Splats
    mouseRef.current.x = mx;
    mouseRef.current.y = my;
    mouseRef.current.isMoving = true;

    // Handle Dissolver Hover Erosion
    if (isPlayMode) {
      const canvasPos = toCanvas(mx, my);
      nodes.forEach(node => {
        if (node.type === 'obstacle' && node.dissolver) {
          // If mouse is inside bounds
          const inside =
            canvasPos.x >= node.x &&
            canvasPos.x <= node.x + node.width &&
            canvasPos.y >= node.y &&
            canvasPos.y <= node.y + node.height;

          if (inside && (!node.dissolveLevel || node.dissolveLevel < 1.0)) {
            // Erode!
            setNodes(prev =>
              prev.map(n =>
                n.id === node.id
                  ? { ...n, dissolveLevel: Math.min(1.0, (n.dissolveLevel || 0) + 0.05) }
                  : n
              )
            );

            // Splat ink drops at mouse (flowing downward, color scaled to prevent blowout)
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



  // Set up dragging node handlers
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

  // Set up resizing handlers
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

  // Set up rotating vector handlers
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
      {/* 1. WebGL Canvas containing fluid shader */}
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

      {/* 2. Hidden Obstacles Texture Canvas */}
      <canvas
        ref={obstacleCanvasRef}
        style={{
          display: 'none'
        }}
      />

      {/* 3. SVG vector overlay for arrows and wind tunnels */}
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
            const nowSec = Date.now() / 1000;
            let activeAngle = node.angle || 0;
            if (node.emitterMode === 'sweep') {
              activeAngle = (node.angle || 0) + Math.sin(nowSec * (node.emitterSweepSpeed || 2.0)) * (node.emitterSweepRange || 45.0);
            }
            const angleRad = (activeAngle * Math.PI) / 180;
            // Draw speed vector arrow
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
                {/* Draggable Emitter Arrow Handle */}
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
            
            // Draw flowing wind arrows inside tunnel box
            const cx = screenPos.x + w / 2;
            const cy = screenPos.y + h / 2;
            const wx = Math.cos(angleRad) * (w * 0.45);
            const wy = Math.sin(angleRad) * (h * 0.45);

            return (
              <g key={`tunnel-vec-${node.id}`}>
                {/* Visual wind path arrow */}
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
                {/* Draggable Wind Tunnel Arrow Handle */}
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
                {/* Spiral arrows representation */}
                <circle
                  cx={screenPos.x}
                  cy={screenPos.y}
                  r={r * 0.5}
                  fill="none"
                  stroke="rgba(157, 78, 221, 0.2)"
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
            const col = node.emitterColor ? `rgb(${Math.round(node.emitterColor[0]*255)}, ${Math.round(node.emitterColor[1]*255)}, ${Math.round(node.emitterColor[2]*255)})` : 'var(--accent-cyan)';
            const glow = node.emitterColor ? `rgba(${Math.round(node.emitterColor[0]*255)}, ${Math.round(node.emitterColor[1]*255)}, ${Math.round(node.emitterColor[2]*255)}, 0.6)` : 'rgba(0, 240, 255, 0.6)';

            const padding = 2 * zoom; // offset line slightly outside card

            if (loc === 'center') {
              const cx = screenPos.x + w/2;
              const cy = screenPos.y + h/2;
              const nowSec = Date.now() / 1000;
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
                  {/* Draggable Card Emitter Arrow Handle */}
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

            // For borders, draw a glowing dashed/pulse line on the border
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

      {/* 4. DOM Canvas components layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none' // allow pass through
        }}
      >
        {nodes.map(node => {
          const screenPos = toScreen(node.x, node.y);
          const isSelected = selectedNodeId === node.id;

          // Elements styling according to selection
          if (node.type === 'obstacle') {
            const dissolveLevel = node.dissolveLevel || 0;
            if (dissolveLevel >= 0.99) return null; // ERODED COMPLETELY

            const w = node.width * zoom;
            const h = node.height * zoom;

            // Background fill resolution (solid vs gradient)
            const bgType = node.cardBgType || 'solid';
            const bgColor1 = node.cardBgColor1 || '#141020';
            const bgColor2 = node.cardBgColor2 || '#0a0814';
            const bgAngle = node.cardBgAngle !== undefined ? node.cardBgAngle : 135;
            const bgOpacity = node.cardBgOpacity !== undefined ? node.cardBgOpacity : 0.35;
            const blurAmt = node.cardBlur !== undefined ? node.cardBlur : 16;

            const bgRgba1 = hexToRgbaStr(bgColor1, bgOpacity);
            const bgRgba2 = hexToRgbaStr(bgColor2, bgOpacity);
            const resolvedBg = node.burner
              ? 'linear-gradient(to top, rgba(255, 0, 127, 0.18), rgba(14, 10, 24, 0.45))'
              : (bgType === 'gradient'
                  ? `linear-gradient(${bgAngle}deg, ${bgRgba1}, ${bgRgba2})`
                  : bgRgba1);

            // Detailed Border
            const borderWidth = node.cardBorderWidth !== undefined ? node.cardBorderWidth : 1;
            const borderStyle = node.cardBorderStyle || 'solid';
            const borderColor = node.cardBorderColor || '#9d4edd';
            const borderOpacity = node.cardBorderOpacity !== undefined ? node.cardBorderOpacity : 0.25;
            const borderRadius = node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12;

            const borderRgba = hexToRgbaStr(borderColor, borderOpacity);
            const activeBorder = isSelected
              ? `1.5px solid var(--accent-cyan)`
              : (borderWidth > 0 ? `${borderWidth * zoom}px ${borderStyle} ${borderRgba}` : 'none');
            const resolvedBorder = node.burner ? '1px solid rgba(255, 0, 127, 0.4)' : activeBorder;

            // Spacing & Padding
            const paddingX = node.cardPaddingX !== undefined ? node.cardPaddingX : 16;
            const paddingY = node.cardPaddingY !== undefined ? node.cardPaddingY : 12;
            const contentGap = node.cardContentGap !== undefined ? node.cardContentGap : 6;

            // Visual Typography
            const titleColor = node.cardTextColor || node.cardTitleColor || '#FFFFFF';
            const titleSize = node.cardFontSize || node.cardTitleSize || 14;
            const titleWeight = node.cardTitleWeight || '600';
            const titleLetterSpacing = node.cardTitleLetterSpacing !== undefined ? node.cardTitleLetterSpacing : 0;
            const titleLineHeight = node.cardTitleLineHeight !== undefined ? node.cardTitleLineHeight : 1.2;

            const subtext = node.cardSubtext !== undefined ? node.cardSubtext : 'Interactive Panel';
            const subColor = node.cardSubColor || '#C77DFF';
            const subSize = node.cardSubSize !== undefined ? node.cardSubSize : 10;
            const subWeight = node.cardSubWeight || '400';
            const subLetterSpacing = node.cardSubLetterSpacing !== undefined ? node.cardSubLetterSpacing : 0;

            // Detailed Shadow (offsets)
            const shadowColor = node.cardShadowColor || node.cardGlowColor || '#9d4edd';
            const shadowOpacity = node.cardShadowOpacity !== undefined ? node.cardShadowOpacity : 0.4;
            const shadowX = node.cardShadowX !== undefined ? node.cardShadowX : 0;
            const shadowY = node.cardShadowY !== undefined ? node.cardShadowY : 0;
            const shadowBlur = node.cardShadowBlur || node.cardGlowIntensity || 15;
            const shadowSpread = node.cardShadowSpread !== undefined ? node.cardShadowSpread : 0;

            const shadowRgba = hexToRgbaStr(shadowColor, shadowOpacity);
            const resolvedShadow = isSelected
              ? `0 0 25px rgba(0, 240, 255, 0.2), 0 10px 40px rgba(0, 0, 0, 0.6)`
              : `${shadowX * zoom}px ${shadowY * zoom}px ${shadowBlur * zoom}px ${shadowSpread * zoom}px ${shadowRgba}, 0 10px 40px rgba(0, 0, 0, 0.6)`;

            const isTextType = node.elementClass === 'text';
            const finalBg = isTextType ? 'none' : resolvedBg;
            const finalBorder = isTextType ? 'none' : resolvedBorder;
            const finalShadow = isTextType ? 'none' : resolvedShadow;
            const finalBlur = isTextType ? 'none' : `blur(${blurAmt}px)`;
            const finalRadius = isTextType ? 0 : borderRadius * zoom;

            // Render mock browser elements
            return (
              <div
                key={node.id}
                className={`canvas-card ${isSelected ? 'selected' : ''}`}
                style={{
                  left: screenPos.x,
                  top: screenPos.y,
                  width: w,
                  height: h,
                  borderRadius: finalRadius,
                  opacity: 1 - dissolveLevel,
                  transform: `scale(${1 - dissolveLevel * 0.1})`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: `${paddingY * zoom}px ${paddingX * zoom}px`,
                  fontSize: Math.max(10, titleSize * zoom),
                  border: finalBorder,
                  background: finalBg,
                  backdropFilter: finalBlur,
                  WebkitBackdropFilter: finalBlur,
                  boxShadow: finalShadow,
                  cursor: activeTool === 'select' ? 'default' : 'crosshair'
                }}
                onMouseDown={(e) => startDragNode(e, node)}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                {/* Handle UI Obstacle categories styling */}
                {node.elementClass === 'button' && (
                  <button
                    className="btn-neon"
                    style={{
                      pointerEvents: 'none',
                      fontSize: Math.max(9, titleSize * zoom),
                      fontWeight: titleWeight,
                      letterSpacing: `${titleLetterSpacing * zoom}px`,
                      borderColor: node.burner ? 'var(--accent-pink)' : borderRgba,
                      color: titleColor,
                      background: finalBg,
                      boxShadow: node.burner ? '0 0 10px rgba(255, 0, 127, 0.2)' : finalShadow,
                      padding: `${6 * zoom}px ${12 * zoom}px`,
                      borderRadius: `${(borderRadius > 4 ? borderRadius - 2 : borderRadius) * zoom}px`
                    }}
                  >
                    {!node.cardHideText ? (node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'Submit')) : ''}
                  </button>
                )}

                {(node.elementClass === 'card' || node.elementClass === 'text') && !node.cardHideText && (
                  <div style={{ textAlign: node.cardTextAlign || 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: contentGap * zoom }}>
                    <div style={{
                      fontWeight: titleWeight,
                      color: titleColor,
                      fontSize: Math.max(10, titleSize * zoom),
                      letterSpacing: `${titleLetterSpacing * zoom}px`,
                      lineHeight: titleLineHeight
                    }}>
                      {node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'Info Card')}
                    </div>
                    {subtext && (
                      <div style={{
                        fontSize: Math.max(8, subSize * zoom),
                        color: subColor,
                        fontWeight: subWeight,
                        letterSpacing: `${subLetterSpacing * zoom}px`
                      }}>
                        {subtext}
                      </div>
                    )}
                  </div>
                )}

                {node.elementClass === 'header' && !node.cardHideText && (
                  <h2 style={{
                    fontWeight: titleWeight,
                    letterSpacing: `${titleLetterSpacing * zoom}px`,
                    color: titleColor,
                    textAlign: node.cardTextAlign || 'center',
                    fontSize: Math.max(12, titleSize * zoom),
                    lineHeight: titleLineHeight,
                    textShadow: node.burner ? '0 0 8px var(--accent-pink)' : `0 0 8px ${hexToRgbaStr(shadowColor, 0.4)}`
                  }}>
                    {node.cardTitleText !== undefined ? node.cardTitleText : (node.label || 'HERO SECTION')}
                  </h2>
                )}

                {/* Resize/Selection handles */}
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

          // Render controller handles for Emitters/Tunnels/Vortexes in the workspace
          if (['emitter', 'windTunnel', 'vortex'].includes(node.type)) {
            const size = 36; // Fixed size in screen pixels for perfect legibility & drag hits
            const isSelected = selectedNodeId === node.id;
            
            // Premium contextual gizmos colors
            let borderCol = 'var(--accent-violet)';
            let glowCol = 'rgba(157, 78, 221, 0.4)';
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
                  left: screenPos.x - size/2,
                  top: screenPos.y - size/2,
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

                {/* Wind Tunnel boundary sizing */}
                {node.type === 'windTunnel' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: size/2 - (node.width * zoom)/2,
                      top: size/2 - (node.height * zoom)/2,
                      width: node.width * zoom,
                      height: node.height * zoom,
                      border: isSelected ? '1px dashed var(--accent-cyan)' : '1px dashed rgba(157, 78, 221, 0.3)',
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
    </div>
  );
}
