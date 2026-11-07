import React from "react";
import { AnimatedIcon } from "./AnimatedIcon";
import { BoxIcon, CartIcon, CogIcon, ChartColumnIncreasingIcon } from "../icons";

const NAV_ITEMS = [
  { label: "PDV / Vendas", icon: CartIcon, animation: "bounce" as const },
  { label: "Produtos", icon: BoxIcon, animation: "glow" as const },
  { label: "Analytics", icon: ChartColumnIncreasingIcon, animation: "pulse" as const },
  { label: "Definições", icon: CogIcon, animation: "tilt" as const },
];

export function SidebarNav() {
  return (
    <nav className="flex w-64 flex-col gap-2 rounded-2xl border border-neutral-800 bg-[#131313] p-4">
      {NAV_ITEMS.map((item) => {
        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            type="button"
            className="group flex items-center gap-3 rounded-xl bg-neutral-900/60 px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
          >
            <AnimatedIcon animation={item.animation}>
              <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12 group-hover:text-[#E1FB15]">
                <IconComponent size={20} className="text-neutral-400 transition-colors" />
              </div>
            </AnimatedIcon>
            <span className="text-xs font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default SidebarNav;
