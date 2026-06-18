// Shared card style resolution — eliminates duplication between CanvasCards.jsx and Compiler.jsx.

import { hexToRgbaStr } from './color';
import type { ObstacleNode } from '../types/nodes';

interface CardStyleOptions {
  zoom?: number;
  isSelected?: boolean;
}

interface ResolvedCardStyles {
  bg: string;
  border: string;
  shadow: string;
  blur: string;
  radius: number;
  paddingX: number;
  paddingY: number;
  contentGap: number;
  titleColor: string;
  titleSize: number;
  titleWeight: string;
  titleLetterSpacing: number;
  titleLineHeight: number;
  subtext: string;
  subColor: string;
  subSize: number;
  subWeight: string;
  subLetterSpacing: number;
  borderRgba: string;
  borderRadius: number;
  blurAmt: number;
}

export function resolveCardStyles(
  node: ObstacleNode,
  { zoom = 1, isSelected = false }: CardStyleOptions = {}
): ResolvedCardStyles {
  // Background
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

  // Border
  const borderWidth = node.cardBorderWidth !== undefined ? node.cardBorderWidth : 1;
  const borderStyle = node.cardBorderStyle || 'solid';
  const borderColor = node.cardBorderColor || '#9d4edd';
  const borderOpacity = node.cardBorderOpacity !== undefined ? node.cardBorderOpacity : 0.25;
  const borderRadius = node.cardBorderRadius !== undefined ? node.cardBorderRadius : 12;

  const borderRgba = hexToRgbaStr(borderColor, borderOpacity);
  const activeBorder = isSelected
    ? '1.5px solid var(--accent-cyan)'
    : (borderWidth > 0 ? `${borderWidth * zoom}px ${borderStyle} ${borderRgba}` : 'none');
  const resolvedBorder = node.burner ? '1px solid rgba(255, 0, 127, 0.4)' : activeBorder;

  // Spacing & Padding
  const paddingX = node.cardPaddingX !== undefined ? node.cardPaddingX : 16;
  const paddingY = node.cardPaddingY !== undefined ? node.cardPaddingY : 12;
  const contentGap = node.cardContentGap !== undefined ? node.cardContentGap : 6;

  // Typography
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

  // Shadow
  const shadowColor = node.cardShadowColor || node.cardGlowColor || '#9d4edd';
  const shadowOpacity = node.cardShadowOpacity !== undefined ? node.cardShadowOpacity : 0.4;
  const shadowX = node.cardShadowX !== undefined ? node.cardShadowX : 0;
  const shadowY = node.cardShadowY !== undefined ? node.cardShadowY : 0;
  const shadowBlur = node.cardShadowBlur || node.cardGlowIntensity || 15;
  const shadowSpread = node.cardShadowSpread !== undefined ? node.cardShadowSpread : 0;

  const shadowRgba = hexToRgbaStr(shadowColor, shadowOpacity);
  const resolvedShadow = isSelected
    ? '0 0 25px rgba(0, 240, 255, 0.2), 0 10px 40px rgba(0, 0, 0, 0.6)'
    : `${shadowX * zoom}px ${shadowY * zoom}px ${shadowBlur * zoom}px ${shadowSpread * zoom}px ${shadowRgba}, 0 10px 40px rgba(0, 0, 0, 0.6)`;

  // Text type handling
  const isTextType = node.elementClass === 'text';

  return {
    bg: isTextType ? 'none' : resolvedBg,
    border: isTextType ? 'none' : resolvedBorder,
    shadow: isTextType ? 'none' : resolvedShadow,
    blur: isTextType ? 'none' : `blur(${blurAmt}px)`,
    radius: isTextType ? 0 : borderRadius * zoom,
    paddingX,
    paddingY,
    contentGap,
    titleColor,
    titleSize,
    titleWeight,
    titleLetterSpacing,
    titleLineHeight,
    subtext,
    subColor,
    subSize,
    subWeight,
    subLetterSpacing,
    borderRgba,
    borderRadius,
    blurAmt,
  };
}
