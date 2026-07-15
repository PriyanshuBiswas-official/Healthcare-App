import React from 'react';
import { useColorScheme } from 'react-native';
import Svg, { Circle, Path, Rect, Line, G } from 'react-native-svg';

type IllustrationProps = {
  size?: number;
};

const COLORS = {
  dark: {
    accent: '#00E5CC',
    muted: '#2A2D40',
    surface: '#1A1B2E',
    danger: '#FF6B6B',
    warning: '#FFB74D',
    purple: '#B388FF',
  },
  light: {
    accent: '#00B8A3',
    muted: '#D0D5E0',
    surface: '#E8EDF5',
    danger: '#FF5252',
    warning: '#FFA726',
    purple: '#9C6ADE',
  },
};

const useColors = () => {
  const scheme = useColorScheme();
  return COLORS[scheme === 'light' ? 'light' : 'dark'];
};

// ── 404: Magnifying glass with question mark ─────────────────────

export const NotFoundIllustration: React.FC<IllustrationProps> = ({ size = 180 }) => {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      {/* Background circle */}
      <Circle cx={90} cy={90} r={80} fill={c.surface} />
      {/* Magnifying glass body */}
      <Circle cx={78} cy={78} r={36} fill="none" stroke={c.muted} strokeWidth={5} />
      <Circle cx={78} cy={78} r={36} fill={c.surface} opacity={0.5} />
      {/* Handle */}
      <Line x1={105} y1={105} x2={135} y2={135} stroke={c.muted} strokeWidth={6} strokeLinecap="round" />
      {/* Question mark */}
      <Path
        d="M72 68 C72 58 80 54 86 54 C92 54 98 58 98 66 C98 72 92 76 86 78 L86 84"
        fill="none"
        stroke={c.accent}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Circle cx={86} cy={94} r={3} fill={c.accent} />
    </Svg>
  );
};

// ── 500: Warning triangle ────────────────────────────────────────

export const ServerErrorIllustration: React.FC<IllustrationProps> = ({ size = 180 }) => {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx={90} cy={90} r={80} fill={c.surface} />
      {/* Triangle */}
      <Path
        d="M90 40 L140 130 L40 130 Z"
        fill="none"
        stroke={c.danger}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d="M90 40 L140 130 L40 130 Z"
        fill={c.danger}
        opacity={0.15}
      />
      {/* Exclamation mark */}
      <Line x1={90} y1={68} x2={90} y2={100} stroke={c.danger} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={90} cy={115} r={3.5} fill={c.danger} />
    </Svg>
  );
};

// ── Maintenance: Gear with wrench ────────────────────────────────

export const MaintenanceIllustration: React.FC<IllustrationProps> = ({ size = 180 }) => {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx={90} cy={90} r={80} fill={c.surface} />
      {/* Gear */}
      <G transform="translate(90,85)">
        {/* Gear teeth */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <Rect
            key={angle}
            x={-5}
            y={-38}
            width={10}
            height={14}
            rx={2}
            fill={c.warning}
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Gear body */}
        <Circle r={26} fill={c.warning} opacity={0.2} />
        <Circle r={26} fill="none" stroke={c.warning} strokeWidth={3} />
        <Circle r={10} fill={c.surface} />
      </G>
      {/* Wrench */}
      <Path
        d="M115 105 L130 120 M130 120 L138 112 M130 120 L138 128"
        fill="none"
        stroke={c.warning}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// ── Permission: Shield with lock ─────────────────────────────────

export const PermissionIllustration: React.FC<IllustrationProps> = ({ size = 180 }) => {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx={90} cy={90} r={80} fill={c.surface} />
      {/* Shield */}
      <Path
        d="M90 35 L130 55 L130 95 C130 120 110 140 90 150 C70 140 50 120 50 95 L50 55 Z"
        fill={c.purple}
        opacity={0.15}
      />
      <Path
        d="M90 35 L130 55 L130 95 C130 120 110 140 90 150 C70 140 50 120 50 95 L50 55 Z"
        fill="none"
        stroke={c.purple}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* Lock body */}
      <Rect x={78} y={82} width={24} height={20} rx={3} fill={c.purple} opacity={0.8} />
      {/* Lock shackle */}
      <Path
        d="M83 82 L83 74 C83 68 87 64 90 64 C93 64 97 68 97 74 L97 82"
        fill="none"
        stroke={c.purple}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Keyhole */}
      <Circle cx={90} cy={90} r={3} fill={c.surface} />
      <Rect x={89} y={90} width={2} height={6} rx={1} fill={c.surface} />
    </Svg>
  );
};

// ── No Internet: WiFi with slash ─────────────────────────────────

export const NoInternetIllustration: React.FC<IllustrationProps> = ({ size = 180 }) => {
  const c = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Circle cx={90} cy={90} r={80} fill={c.surface} />
      {/* WiFi arcs */}
      <Path
        d="M55 80 C65 65 78 58 90 58 C102 58 115 65 125 80"
        fill="none"
        stroke={c.accent}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.4}
      />
      <Path
        d="M65 92 C72 82 80 78 90 78 C100 78 108 82 115 92"
        fill="none"
        stroke={c.accent}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M75 104 C80 98 85 96 90 96 C95 96 100 98 105 104"
        fill="none"
        stroke={c.accent}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* Dot */}
      <Circle cx={90} cy={114} r={5} fill={c.accent} />
      {/* Slash */}
      <Line x1={55} y1={125} x2={125} y2={55} stroke={c.danger} strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
};
