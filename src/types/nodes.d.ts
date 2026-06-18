// Core Node Types for FLUX Spatial Fluid Dynamics Studio

/** RGB color as [r, g, b] where each component is 0-1 */
export type RGBColor = [number, number, number];

// ============================================================
// Base Node
// ============================================================

interface BaseNode {
  id: string;
  type: string;
  x: number;
  y: number;
}

// ============================================================
// Emitter Node
// ============================================================

export interface EmitterNode extends BaseNode {
  type: 'emitter';
  angle: number;
  speed: number;
  radius: number;
  color: RGBColor;
  emitterMode?: 'continuous' | 'pulse' | 'sweep';
  emitterPulseFreq?: number;
  emitterSweepSpeed?: number;
  emitterSweepRange?: number;
  emitterDensity?: number;
}

// ============================================================
// Vortex Node
// ============================================================

export interface VortexNode extends BaseNode {
  type: 'vortex';
  radius: number;
  strength: number;
}

// ============================================================
// Wind Tunnel Node
// ============================================================

export interface WindTunnelNode extends BaseNode {
  type: 'windTunnel';
  width: number;
  height: number;
  angle: number;
  speed: number;
}

// ============================================================
// Obstacle Node
// ============================================================

export type ElementClass = 'card' | 'button' | 'header' | 'text';
export type EmitterLocation = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'outline';
export type BgType = 'solid' | 'gradient';
export type BorderStyle = 'solid' | 'dashed' | 'dotted';
export type TextAlign = 'left' | 'center' | 'right';

export interface ObstacleNode extends BaseNode {
  type: 'obstacle';
  width: number;
  height: number;
  borderRadius: number;
  label: string;
  elementClass: ElementClass;
  collider?: boolean;
  burner: boolean;
  dissolver: boolean;
  dissolveLevel: number;

  // Card emitter properties
  cardEmitter?: boolean;
  emitterLocation?: EmitterLocation;
  emitterMode?: 'continuous' | 'pulse' | 'sweep';
  emitterAngle?: number;
  emitterSweepSpeed?: number;
  emitterSweepRange?: number;
  emitterPulseFreq?: number;
  emitterSpeed?: number;
  emitterRadius?: number;
  emitterDensity?: number;
  emitterColor?: RGBColor;

  // Background
  cardBgType?: BgType;
  cardBgColor1?: string;
  cardBgColor2?: string;
  cardBgAngle?: number;
  cardBgOpacity?: number;
  cardBlur?: number;

  // Border
  cardBorderWidth?: number;
  cardBorderStyle?: BorderStyle;
  cardBorderColor?: string;
  cardBorderOpacity?: number;
  cardBorderRadius?: number; // card-specific override for border radius

  // Padding
  cardPaddingX?: number;
  cardPaddingY?: number;
  cardContentGap?: number;

  // Title typography
  cardTextColor?: string;
  cardTitleColor?: string;
  cardFontSize?: number;
  cardTitleSize?: number; // fallback alias for cardFontSize
  cardTitleWeight?: string;
  cardTitleLetterSpacing?: number;
  cardTitleLineHeight?: number;
  cardTextAlign?: TextAlign;

  // Subtitle typography
  cardSubtext?: string;
  cardSubColor?: string;
  cardSubSize?: number;
  cardSubWeight?: string;
  cardSubLetterSpacing?: number;

  // Title/subtitle text content
  cardTitleText?: string;
  cardHideText?: boolean;

  // Shadow
  cardShadowColor?: string;
  cardGlowColor?: string;
  cardShadowOpacity?: number;
  cardShadowX?: number;
  cardShadowY?: number;
  cardShadowBlur?: number;
  cardGlowIntensity?: number;
  cardShadowSpread?: number;
}

// ============================================================
// Union Type
// ============================================================

export type Node = EmitterNode | VortexNode | WindTunnelNode | ObstacleNode;
