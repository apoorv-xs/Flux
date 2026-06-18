// WebGL2 Navier-Stokes Fluid Solver

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BASE_FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
void main() {
  fragColor = texture(uSource, vUv);
}
`;

const SPLAT_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uSource;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspectRatio;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspectRatio;
  float splat = exp(-dot(p, p) / uRadius);
  vec3 base = texture(uSource, vUv).xyz;
  fragColor = vec4(base + uColor * splat, 1.0);
}
`;

const ADVECT_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uObstacles;
uniform vec2 uTexelSize;
uniform float uDt;
uniform float uDissipation;

void main() {
  // If inside obstacle, fade to zero
  float obstacle = texture(uObstacles, vUv).r;
  if (obstacle > 0.1) {
    fragColor = vec4(0.0);
    return;
  }
  
  // Trace back in time
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - uDt * uTexelSize * vel;
  
  // Clamp boundaries to prevent sampling outside range
  coord = clamp(coord, 0.001, 0.999);
  
  fragColor = uDissipation * texture(uSource, coord);
}
`;

const DIVERGENCE_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;
uniform vec2 uTexelSize;

void main() {
  float oC = texture(uObstacles, vUv).r;
  if (oC > 0.1) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 vL = texture(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).xy;
  vec2 vR = texture(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).xy;
  vec2 vB = texture(uVelocity, vUv - vec2(0.0, uTexelSize.y)).xy;
  vec2 vT = texture(uVelocity, vUv + vec2(0.0, uTexelSize.y)).xy;

  float oL = texture(uObstacles, vUv - vec2(uTexelSize.x, 0.0)).r;
  float oR = texture(uObstacles, vUv + vec2(uTexelSize.x, 0.0)).r;
  float oB = texture(uObstacles, vUv - vec2(0.0, uTexelSize.y)).r;
  float oT = texture(uObstacles, vUv + vec2(0.0, uTexelSize.y)).r;

  // Reflection boundary conditions
  if (oL > 0.1) vL = -vR;
  if (oR > 0.1) vR = -vL;
  if (oB > 0.1) vB = -vT;
  if (oT > 0.1) vT = -vB;

  float div = 0.5 * ((vR.x - vL.x) + (vT.y - vB.y));
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const JACOBI_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform sampler2D uObstacles;
uniform vec2 uTexelSize;

void main() {
  float oC = texture(uObstacles, vUv).r;
  if (oC > 0.1) {
    fragColor = vec4(0.0);
    return;
  }

  float pL = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).r;
  float pR = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).r;
  float pB = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).r;
  float pT = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).r;

  float oL = texture(uObstacles, vUv - vec2(uTexelSize.x, 0.0)).r;
  float oR = texture(uObstacles, vUv + vec2(uTexelSize.x, 0.0)).r;
  float oB = texture(uObstacles, vUv - vec2(0.0, uTexelSize.y)).r;
  float oT = texture(uObstacles, vUv + vec2(0.0, uTexelSize.y)).r;

  // Neumann boundary condition: copy neighbor pressure
  if (oL > 0.1) pL = pR;
  if (oR > 0.1) pR = pL;
  if (oB > 0.1) pB = pT;
  if (oT > 0.1) pT = pB;

  float div = texture(uDivergence, vUv).r;
  // Jacobi iteration formula
  fragColor = vec4(0.25 * (pL + pR + pB + pT - div), 0.0, 0.0, 1.0);
}
`;

const SUBTRACT_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uPressure;
uniform sampler2D uObstacles;
uniform vec2 uTexelSize;

void main() {
  float oC = texture(uObstacles, vUv).r;
  if (oC > 0.1) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float pL = texture(uPressure, vUv - vec2(uTexelSize.x, 0.0)).r;
  float pR = texture(uPressure, vUv + vec2(uTexelSize.x, 0.0)).r;
  float pB = texture(uPressure, vUv - vec2(0.0, uTexelSize.y)).r;
  float pT = texture(uPressure, vUv + vec2(0.0, uTexelSize.y)).r;

  float oL = texture(uObstacles, vUv - vec2(uTexelSize.x, 0.0)).r;
  float oR = texture(uObstacles, vUv + vec2(uTexelSize.x, 0.0)).r;
  float oB = texture(uObstacles, vUv - vec2(0.0, uTexelSize.y)).r;
  float oT = texture(uObstacles, vUv + vec2(0.0, uTexelSize.y)).r;

  if (oL > 0.1) pL = pR;
  if (oR > 0.1) pR = pL;
  if (oB > 0.1) pB = pT;
  if (oT > 0.1) pT = pB;

  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 grad = vec2(pR - pL, pT - pB) * 0.5;
  fragColor = vec4(vel - grad, 0.0, 1.0);
}
`;

const RENDER_SHADER_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform sampler2D uObstacles;
uniform int uRenderMode; // 0: Dye, 1: Velocity, 2: Obstacles

void main() {
  float obstacle = texture(uObstacles, vUv).r;
  
  if (uRenderMode == 0) {
    vec3 color = texture(uDye, vUv).rgb;
    // Blend fluid dye under obstacles for real frosted-glass backdrops
    if (obstacle > 0.1) {
      fragColor = vec4(color * 0.7 + vec3(0.06, 0.04, 0.1) * 0.3, 1.0);
    } else {
      fragColor = vec4(color, 1.0);
    }
  } else if (uRenderMode == 1) {
    vec2 vel = texture(uVelocity, vUv).xy;
    vec3 color = vec3(abs(vel.x) * 2.0, abs(vel.y) * 2.0, max(abs(vel.x), abs(vel.y)));
    if (obstacle > 0.1) {
      fragColor = vec4(0.1, 0.1, 0.1, 1.0);
    } else {
      fragColor = vec4(color, 1.0);
    }
  } else {
    // Render obstacles map directly
    fragColor = vec4(vec3(obstacle), 1.0);
  }
}
`;

// Helper: compile shader
function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compilation error: " + log);
  }
  return shader;
}

// Helper: create program
function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Program linking error: " + gl.getProgramInfoLog(program));
  }
  return program;
}

export class FluidSolver {
  gl: WebGL2RenderingContext;
  simWidth: number;
  simHeight: number;
  splatProgram: WebGLProgram;
  advectProgram: WebGLProgram;
  divergenceProgram: WebGLProgram;
  jacobiProgram: WebGLProgram;
  subtractProgram: WebGLProgram;
  renderProgram: WebGLProgram;
  baseProgram: WebGLProgram;
  quadBuffer: WebGLBuffer;
  obstacleTexture: WebGLTexture;
  velocity: ReturnType<FluidSolver['createDoubleBuffer']>;
  dye: ReturnType<FluidSolver['createDoubleBuffer']>;
  pressure: ReturnType<FluidSolver['createDoubleBuffer']>;
  divergence: ReturnType<FluidSolver['createBufferObject']>;
  vao!: WebGLVertexArrayObject;

  constructor(gl: WebGL2RenderingContext, simWidth = 256, simHeight = 256) {
    this.gl = gl;
    this.simWidth = simWidth;
    this.simHeight = simHeight;

    // Check extensions for float textures in WebGL2
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.warn("EXT_color_buffer_float not supported. Trying half-float...");
    }

    // Compile programs
    this.splatProgram = createProgram(gl, VERTEX_SHADER_SRC, SPLAT_SHADER_SRC);
    this.advectProgram = createProgram(gl, VERTEX_SHADER_SRC, ADVECT_SHADER_SRC);
    this.divergenceProgram = createProgram(gl, VERTEX_SHADER_SRC, DIVERGENCE_SHADER_SRC);
    this.jacobiProgram = createProgram(gl, VERTEX_SHADER_SRC, JACOBI_SHADER_SRC);
    this.subtractProgram = createProgram(gl, VERTEX_SHADER_SRC, SUBTRACT_SHADER_SRC);
    this.renderProgram = createProgram(gl, VERTEX_SHADER_SRC, RENDER_SHADER_SRC);
    this.baseProgram = createProgram(gl, VERTEX_SHADER_SRC, BASE_FRAGMENT_SHADER_SRC);

    // Quad geometry setup
    this.quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    // Obstacle mask texture
    this.obstacleTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R8,
      this.simWidth,
      this.simHeight,
      0,
      gl.RED,
      gl.UNSIGNED_BYTE,
      null
    );

    // Initialize double buffers
    // Format: RGBA16F (for velocity/density) and R16F (for pressure/divergence)
    this.velocity = this.createDoubleBuffer(this.simWidth, this.simHeight, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    this.dye = this.createDoubleBuffer(this.simWidth, this.simHeight, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
    this.pressure = this.createDoubleBuffer(this.simWidth, this.simHeight, gl.R16F, gl.RED, gl.HALF_FLOAT);
    this.divergence = this.createBufferObject(this.simWidth, this.simHeight, gl.R16F, gl.RED, gl.HALF_FLOAT);

    this.initAttributes();
  }

  createBufferObject(w: number, h: number, internalFormat: number, format: number, type: number) {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return { texture, fbo };
  }

  createDoubleBuffer(w: number, h: number, internalFormat: number, format: number, type: number) {
    const fbo1 = this.createBufferObject(w, h, internalFormat, format, type);
    const fbo2 = this.createBufferObject(w, h, internalFormat, format, type);

    return {
      get read() {
        return fbo1;
      },
      get write() {
        return fbo2;
      },
      swap() {
        const tmp = fbo1.texture;
        fbo1.texture = fbo2.texture;
        fbo2.texture = tmp;

        const tmpFbo = fbo1.fbo;
        fbo1.fbo = fbo2.fbo;
        fbo2.fbo = tmpFbo;
      },
    };
  }

  initAttributes() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    
    // We'll reuse VAO binding pattern
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    
    const posLoc = gl.getAttribLocation(this.splatProgram, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindVertexArray(null);
  }

  // Draw obstacles using 2D canvas mask
  updateObstacles(canvas: HTMLCanvasElement) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, canvas);
  }

  // Injects splats (dye or velocity forces)
  splat(fbo: { read: { texture: WebGLTexture }; write: { fbo: WebGLFramebuffer }; swap(): void }, x: number, y: number, color: number[], radius: number, aspect: number) {
    const gl = this.gl;
    gl.viewport(0, 0, this.simWidth, this.simHeight);
    gl.useProgram(this.splatProgram);

    // Bind inputs
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.splatProgram, "uSource"), 0);

    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(this.splatProgram, "uPoint"), x, y);
    gl.uniform3f(gl.getUniformLocation(this.splatProgram, "uColor"), color[0], color[1], color[2]);
    gl.uniform1f(gl.getUniformLocation(this.splatProgram, "uRadius"), radius);
    gl.uniform1f(gl.getUniformLocation(this.splatProgram, "uAspectRatio"), aspect);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.write.fbo);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    fbo.swap();
  }

  // Step the simulation
  step(dt: number, viscosity: number, dissipation: number, iterations = 20) {
    const gl = this.gl;
    const texelX = 1.0 / this.simWidth;
    const texelY = 1.0 / this.simHeight;

    // 1. Advect velocity field
    gl.viewport(0, 0, this.simWidth, this.simHeight);
    gl.useProgram(this.advectProgram);
    gl.uniform2f(gl.getUniformLocation(this.advectProgram, "uTexelSize"), texelX, texelY);
    gl.uniform1f(gl.getUniformLocation(this.advectProgram, "uDt"), dt);
    gl.uniform1f(gl.getUniformLocation(this.advectProgram, "uDissipation"), 1.0); // Velocity dissipation

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.advectProgram, "uVelocity"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.advectProgram, "uSource"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.uniform1i(gl.getUniformLocation(this.advectProgram, "uObstacles"), 2);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocity.write.fbo);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.velocity.swap();

    // 2. Advect dye (smoke) field
    gl.useProgram(this.advectProgram);
    gl.uniform1f(gl.getUniformLocation(this.advectProgram, "uDissipation"), dissipation);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.advectProgram, "uVelocity"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.dye.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.advectProgram, "uSource"), 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dye.write.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.dye.swap();

    // 3. Compute Divergence
    gl.useProgram(this.divergenceProgram);
    gl.uniform2f(gl.getUniformLocation(this.divergenceProgram, "uTexelSize"), texelX, texelY);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.divergenceProgram, "uVelocity"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.uniform1i(gl.getUniformLocation(this.divergenceProgram, "uObstacles"), 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.divergence.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // 4. Pressure Jacobi Solver (enforces incompressibility)
    // Clear pressure to zero first for rapid convergence
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.read.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.jacobiProgram);
    gl.uniform2f(gl.getUniformLocation(this.jacobiProgram, "uTexelSize"), texelX, texelY);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.divergence.texture);
    gl.uniform1i(gl.getUniformLocation(this.jacobiProgram, "uDivergence"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.uniform1i(gl.getUniformLocation(this.jacobiProgram, "uObstacles"), 2);

    for (let i = 0; i < iterations; i++) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
      gl.uniform1i(gl.getUniformLocation(this.jacobiProgram, "uPressure"), 0);

      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pressure.write.fbo);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.pressure.swap();
    }

    // 5. Gradient Subtraction to correct velocity
    gl.useProgram(this.subtractProgram);
    gl.uniform2f(gl.getUniformLocation(this.subtractProgram, "uTexelSize"), texelX, texelY);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.subtractProgram, "uVelocity"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.pressure.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.subtractProgram, "uPressure"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.uniform1i(gl.getUniformLocation(this.subtractProgram, "uObstacles"), 2);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.velocity.write.fbo);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.velocity.swap();

    gl.bindVertexArray(null);
  }

  // Render fluid simulation to screen
  render(width: number, height: number, renderMode = 0) {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.renderProgram);

    // Bind inputs
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dye.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uDye"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.velocity.read.texture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uVelocity"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uObstacles"), 2);

    gl.uniform1i(gl.getUniformLocation(this.renderProgram, "uRenderMode"), renderMode);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  clear() {
    const gl = this.gl;
    
    // Clear double buffers
    const clearFBO = (fbo: { fbo: WebGLFramebuffer }) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    };

    clearFBO(this.velocity.read);
    clearFBO(this.velocity.write);
    clearFBO(this.dye.read);
    clearFBO(this.dye.write);
    clearFBO(this.pressure.read);
    clearFBO(this.pressure.write);
  }

  destroy() {
    const gl = this.gl;
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteTexture(this.obstacleTexture);
    gl.deleteVertexArray(this.vao);

    const deleteBuffer = (fbo: { texture: WebGLTexture; fbo: WebGLFramebuffer }) => {
      gl.deleteTexture(fbo.texture);
      gl.deleteFramebuffer(fbo.fbo);
    };

    deleteBuffer(this.velocity.read);
    deleteBuffer(this.velocity.write);
    deleteBuffer(this.dye.read);
    deleteBuffer(this.dye.write);
    deleteBuffer(this.pressure.read);
    deleteBuffer(this.pressure.write);
    deleteBuffer(this.divergence);
    
    gl.deleteProgram(this.splatProgram);
    gl.deleteProgram(this.advectProgram);
    gl.deleteProgram(this.divergenceProgram);
    gl.deleteProgram(this.jacobiProgram);
    gl.deleteProgram(this.subtractProgram);
    gl.deleteProgram(this.renderProgram);
    gl.deleteProgram(this.baseProgram);
  }
}
