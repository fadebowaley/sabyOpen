// export default Sidebar;

import React, { useState, useRef } from "react";
import NodeTypeItem from "./NodeTypeItem";
import Draggable from "react-draggable";
import { useFlowContext } from "@core/context/FlowContext";
import {
  GripHorizontal,
  GalleryVerticalEnd,
  Sparkles,
  Snowflake,
  Gem,
  Star,
  PanelTop,
  Hexagon,
  SunMedium,
  Diamond,
  Crown,
} from "lucide-react";

const nodeTypes = [
  {
    id: "jasper",
    label: "Jasper",
    icon: <GalleryVerticalEnd size={28} strokeWidth={3} />,
    color: "#ff7f00",
  },
  {
    id: "diamond",
    label: "Diamond",
    icon: <Diamond size={28} strokeWidth={3} />,
    color: "#00ffff",
  },
  {
    id: "emerald",
    label: "Emerald",
    icon: <Gem size={28} strokeWidth={3} />,
    color: "#50ff50",
  },
  {
    id: "topaz",
    label: "Topaz",
    icon: <Star size={28} strokeWidth={3} />,
    color: "#ffff00",
  },
  {
    id: "sapphire",
    label: "Sapphire",
    icon: <Snowflake size={28} strokeWidth={3} />,
    color: "#3333ff",
  },
  {
    id: "ruby",
    label: "Ruby",
    icon: <Hexagon size={28} strokeWidth={3} />,
    color: "#ff3333",
  },
  {
    id: "amethyst",
    label: "Amethyst",
    icon: <Sparkles size={28} strokeWidth={3} />,
    color: "#ff00ff",
  },
  {
    id: "citrine",
    label: "Citrine",
    icon: <SunMedium size={28} strokeWidth={3} />,
    color: "#ffd700",
  },
  {
    id: "opal",
    label: "Opal",
    icon: <PanelTop size={28} strokeWidth={3} />,
    color: "#4b0082",
  },
  {
    id: "pearl",
    label: "Pearl",
    icon: <Crown size={28} strokeWidth={3} />,
    color: "#ffc0cb",
  },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isDarkMode } = useFlowContext();
  const nodeRef = useRef(null);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      position={position}
      onDrag={handleDrag}>
      <div
        ref={nodeRef}
        className={`fixed right-3 top-60 z-50 transition-all duration-300 ease-in-out group
          ${
            isDarkMode
              ? "bg-gray-900/95 border-gray-700"
              : "bg-white/95 border-gray-200"
          }
          backdrop-blur-sm border-0 rounded-2xl shadow-xl
          ${isCollapsed ? "w-[53px] group-hover:w-[73px]" : "w-[73px]"}
          hover:w-[59px]`}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}>
        {/* Toggle Button */}
        <div className="flex justify-end p-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-6 h-6 rounded-full text-xs font-bold
              ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
              }`}>
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Drag handle */}
        <div className="drag-handle cursor-move px-2 pb-2 flex justify-center">
          <GripHorizontal className="w-4 h-4 text-gray-400" />
        </div>

        {/* Node Icons */}
        <div className="px-1 pb-2 max-h-[75vh] overflow-y-auto">
          <div className="flex flex-col gap-1">
            {nodeTypes.map((type) => (
              <div
                key={type.id}
                title={isCollapsed ? type.label : ""}
                className="transition-transform duration-200 ease-in-out">
                <NodeTypeItem
                  nodeType={type}
                  onDragStart={onDragStart}
                  isCollapsed={isCollapsed}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default Sidebar;
