import React, { useMemo } from "react";

export interface BorderParticlesProps {
  active: boolean;
  count?: number;
}

interface Particle {
  id: number;
  edge: "top" | "right" | "bottom" | "left";
  edgePos: number; // 0% to 100%
  size: number;
  color: string;
  delay: number;
  duration: number;
  translateX: number;
  translateY: number;
}

const GREEN_COLORS = [
  "#32D583", // Emerald Masakula
  "#10B981", // Tailwind Emerald 500
  "#4ADE80", // Tailwind Green 400
  "#86EFAC", // Light mint green
  "#E1FB15", // Neon Lime Masakula
  "#A7F3D0", // Soft glow green
];

export const BorderParticles: React.FC<BorderParticlesProps> = ({ active, count = 28 }) => {
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const edges: ("top" | "right" | "bottom" | "left")[] = ["top", "right", "bottom", "left"];

    for (let i = 0; i < count; i++) {
      const edge = edges[i % 4];
      const edgePos = Math.random() * 92 + 4; // 4% to 96%
      const size = Math.floor(Math.random() * 4) + 3; // 3px to 6px
      const color = GREEN_COLORS[Math.floor(Math.random() * GREEN_COLORS.length)];
      const delay = Math.random() * 350; // 0 to 350ms
      const duration = Math.random() * 600 + 800; // 800ms to 1400ms

      let translateX = 0;
      let translateY = 0;

      if (edge === "top") {
        translateX = (Math.random() - 0.5) * 24;
        translateY = -(Math.random() * 26 + 14); // Shoot upward
      } else if (edge === "bottom") {
        translateX = (Math.random() - 0.5) * 24;
        translateY = Math.random() * 26 + 14; // Shoot downward
      } else if (edge === "left") {
        translateX = -(Math.random() * 26 + 14); // Shoot left
        translateY = (Math.random() - 0.5) * 24;
      } else if (edge === "right") {
        translateX = Math.random() * 26 + 14; // Shoot right
        translateY = (Math.random() - 0.5) * 24;
      }

      list.push({
        id: i,
        edge,
        edgePos,
        size,
        color,
        delay,
        duration,
        translateX,
        translateY,
      });
    }
    return list;
  }, [count, active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
      {particles.map((p) => {
        let style: React.CSSProperties = {
          position: "absolute",
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          borderRadius: "9999px",
          boxShadow: `0 0 8px ${p.color}, 0 0 14px ${p.color}`,
          animation: `greenParticleBurst ${p.duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}ms infinite alternate`,
          ["--particle-translate" as string]: `translate(${p.translateX}px, ${p.translateY}px)`,
        };

        if (p.edge === "top") {
          style.top = "-2px";
          style.left = `${p.edgePos}%`;
        } else if (p.edge === "bottom") {
          style.bottom = "-2px";
          style.left = `${p.edgePos}%`;
        } else if (p.edge === "left") {
          style.left = "-2px";
          style.top = `${p.edgePos}%`;
        } else if (p.edge === "right") {
          style.right = "-2px";
          style.top = `${p.edgePos}%`;
        }

        return <span key={p.id} style={style} className="block pointer-events-none" />;
      })}
    </div>
  );
};

export default BorderParticles;
