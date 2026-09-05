import { Tooltip } from "../../ui/Tooltip.jsx";

/** Tooltip shown next to icons when the sidebar is collapsed. */
export function SidebarTooltip({ content, disabled = false, children }) {
  if (disabled) return children;
  return (
    <Tooltip content={content} side="right" className="w-full">
      {children}
    </Tooltip>
  );
}
