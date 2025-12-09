'use client';

import { RectItem } from '../types';

interface SvgRectProps {
  rects: RectItem[];
  scale: number;
  activeId: string | number | null;
  onRectClick: (contentId: string | number) => void;
}

export default function SvgRect({ rects, scale, activeId, onRectClick }: SvgRectProps) {
  if (!rects?.length || !scale) return null;

  return (
    <svg
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {rects.map((rect) => {
        const points = rect.position;
        if (!points || points.length < 8) return null;

        // 转换坐标点
        const scaledPoints = points.map((p) => p * scale);
        const pointsStr = `${scaledPoints[0]},${scaledPoints[1]} ${scaledPoints[2]},${scaledPoints[3]} ${scaledPoints[4]},${scaledPoints[5]} ${scaledPoints[6]},${scaledPoints[7]}`;

        const isActive = String(activeId) === String(rect.content_id);
        const typeColors: Record<string, string> = {
          paragraph: '#4CAF50',
          title: '#2196F3',
          table: '#FF9800',
          image: '#9C27B0',
        };
        const color = typeColors[rect.type] || '#4CAF50';

        return (
          <polygon
            key={rect.content_id}
            points={pointsStr}
            fill={isActive ? `${color}33` : 'transparent'}
            stroke={color}
            strokeWidth={isActive ? 2 : 1}
            className="pointer-events-auto cursor-pointer transition-all hover:fill-[rgba(66,133,244,0.2)]"
            onClick={() => onRectClick(rect.content_id)}
            data-content-id={rect.content_id}
          />
        );
      })}
    </svg>
  );
}
