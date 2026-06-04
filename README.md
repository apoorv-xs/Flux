# FLUX // Spatial Fluid Dynamics Studio

FLUX is a high-fidelity, interactive, WebGL-powered 2D spatial sandbox where design meets real-time fluid dynamics. Designers and developers can sketch, place, drag, and configure fluid objects (Emitters, Vortexes, Wind Tunnels) alongside pre-styled glassmorphic UI components on an infinite canvas, and compile the entire setup into standalone HTML/GLSL, React, or lightweight Canvas2D code.

---

## 🚀 Key Features

*   **Real-time WebGL Solver**: Solves incompressible Navier-Stokes equations at 60fps in the browser using custom double-buffered WebGL shader pipelines.
*   **Arbitrary Obstacle Collisions**: An offscreen Canvas2D mask automatically registers DOM elements and shapes to act as physical boundary colliders for the fluid.
*   **Context-sensitive Spatial Gizmos**: Drag emitters, adjust wind tunnel widths/heights, and adjust direction vectors directly on the interactive blueprint canvas.
*   **Figma-style Interaction**: Support for middle-mouse/trackpad panning, dynamic zoom centered at pointer, and precise selection grips.
*   **Design-to-Code Exporter**: Generate production-ready layouts in one click (fully responsive HTML+GLSL template, React canvas hook, or CPU-based particle fallbacks).
*   **Glassmorphic Design Engine**: Fine-tune backdrop blurs, double-bevel borders, gradient backplanes, content alignment, and glowing ambient drop-shadows.

---

## 🛠️ Codebase Structure

*   `src/components/Canvas.jsx`: Grid renderer, vector handlers, dragging controllers, and SVG layers.
*   `src/components/Inspector.jsx`: Details panel for global physics attributes, advanced emitter sweeps, and micro-design layout values.
*   `src/components/Compiler.jsx`: Live code compiler generating stand-alone templates.
*   `src/utils/fluidSolver.js`: Custom WebGL solver context (advection, splats, pressure Jacobi relaxations, and memory allocation cleanups).
*   `src/utils/color.js`: Consolidated RGB, Hex, and RGBA helper libraries.
*   `src/index.css`: Cyber-Ultraviolet design system style rules.

---

## ⚙️ Running Locally

1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Build the production distribution:
    ```bash
    npm run build
    ```
4.  Preview the production build:
    ```bash
    npm run preview
    ```
