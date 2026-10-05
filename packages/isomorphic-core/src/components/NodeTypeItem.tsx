
import React from "react";

type NodeType = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

type NodeTypeItemProps = {
  nodeType: NodeType;
  onDragStart: (event: React.DragEvent, id: string) => void;
  isCollapsed: boolean;
};

const NodeTypeItem: React.FC<NodeTypeItemProps> = ({
  nodeType,
  onDragStart,
  isCollapsed,
}) => {

return (
  <div
    className={`flex flex-col items-center justify-center
      ${isCollapsed ? "w-10 h-10 p-1" : "w-14 h-14 p-1"}
      rounded-xl border-2 cursor-grab transition-all duration-150 hover:scale-105`}
    draggable
    onDragStart={(event) => onDragStart(event, nodeType.id)}
    style={{
      boxShadow: `0 0 12px ${nodeType.color}44`,
      borderColor: `${nodeType.color}88`,
      backgroundColor: "transparent",
    }}
  >
    <div
      className="transition-transform duration-200 hover:scale-110 flex items-center justify-center"
      style={{
        color: nodeType.color,
        fontSize: isCollapsed ? 18 : 28,
        lineHeight: 1,
      }}
    >
      {React.isValidElement(nodeType.icon)
        ? React.cloneElement(nodeType.icon, { size: isCollapsed ? 18 : 28 })
        : nodeType.icon}
    </div>

    {!isCollapsed && (
      <span
        className="text-[10px] font-medium text-center truncate leading-tight"
        style={{ color: nodeType.color, maxWidth: "100%" }}
      >
        {nodeType.label}
      </span>
    )}
  </div>
);
};
export default NodeTypeItem;
