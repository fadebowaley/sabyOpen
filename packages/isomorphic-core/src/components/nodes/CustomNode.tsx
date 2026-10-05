import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useFlowContext } from '../../context/FlowContext';

const CustomNode = ({ data, isConnectable, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.name || "Untitled Node");
  const [showMenu, setShowMenu] = useState(false);
  const { nodes, setNodes, edges, setEdges, isDarkMode } = useFlowContext();

  // Debug: Log when component renders
  React.useEffect(() => {
    console.log(
      "[CUSTOM NODE - RENDER] Node rendered:",
      data.name,
      "Level:",
      data.level
    );
  }, [data.name, data.level]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const updatedNodes = nodes.map((node) => {
      if (node.id === data.id) {
        return { ...node, data: { ...node.data, name } };
      }
      return node;
    });
    setNodes(updatedNodes);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      const updatedNodes = nodes.map((node) => {
        if (node.id === data.id) {
          return { ...node, data: { ...node.data, name } };
        }
        return node;
      });
      setNodes(updatedNodes);
    }
  };

  const handleDelete = () => {
    setNodes(nodes.filter((n) => n.id !== data.id));
    setEdges(edges.filter((e) => e.source !== data.id && e.target !== data.id));
    setShowMenu(false);
    alert(`Node ${data.name} deleted`);
  };

  const getBorderColor = () => {
    const typeColors = nodeTypes[data.type] || {
      neonColor: getLevelColor(data.level || 0),
    };
    return typeColors.neonColor;
  };

  const getGlowColor = () => {
    return getLevelColor(data.level || 0, 0.6);
  };

  const nodeStyle = {
    borderColor: getBorderColor(),
    boxShadow: selected
      ? `0 0 0 2px ${getBorderColor()}, 0 0 15px ${getGlowColor()}`
      : `0 0 8px ${getGlowColor()}`,
    aspectRatio: "1 / 1",
    minWidth: "160px",
    minHeight: "160px",
    background: isDarkMode ? "rgb(31, 41, 55)" : "transparent",
  };

  return (
    <div
      className="relative border-2 rounded-[15px] p-4 transition-all duration-200"
      style={nodeStyle}
      onDoubleClick={handleDoubleClick}>
      <div
        className="absolute -top-3 right-0 bg-gray-800 px-2 py-1 rounded-full border-2 text-xs font-bold"
        style={{ borderColor: getBorderColor(), color: getBorderColor() }}>
        Level {data.level || 0}
      </div>

      {(data.active || data.special) && (
        <div className="absolute top-4 left-4 flex space-x-2">
          {data.active && (
            <div
              className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
              title="Active"
            />
          )}
          {data.special && (
            <div
              className="w-3 h-3 rounded-full bg-purple-500 animate-pulse"
              title="Special"
            />
          )}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500"
      />

      <div className="absolute top-2 right-2">
        <button
          className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          onClick={() => setShowMenu(!showMenu)}>
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1">
            <button
              className="flex items-center px-3 py-1 text-sm text-red-400 hover:bg-gray-700 w-full"
              onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <input
          type="text"
          value={data.name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-gray-200 font-medium border-b border-gray-600 focus:outline-none focus:border-blue-500 px-1 py-0.5 mt-6"
          autoFocus
        />
      ) : (
        <div className="flex flex-col h-full mt-6">
          <div className="text-gray-200 font-medium">{data.name}</div>
          {data.description && (
            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500"
      />

      <Handle
        type="source"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500"
      />

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
};

const nodeTypes = {
  diamond: { neonColor: '#00ffff' },
  emerald: { neonColor: '#50ff50' },
  ruby: { neonColor: '#ff3333' },
  sapphire: { neonColor: '#3333ff' },
  topaz: { neonColor: '#ffff00' },
  amethyst: { neonColor: '#ff00ff' },
  opal: { neonColor: '#4b0082' },
  pearl: { neonColor: '#ffc0cb' },
  jasper: { neonColor: '#ff7f00' },
  garnet: { neonColor: '#c71585' }
};

const getLevelColor = (level, opacity = 1) => {
  const colors = [
    `rgba(245, 158, 11, ${opacity})`,
    `rgba(99, 102, 241, ${opacity})`,
    `rgba(236, 72, 153, ${opacity})`,
    `rgba(16, 185, 129, ${opacity})`,
    `rgba(239, 68, 68, ${opacity})`,
    `rgba(139, 92, 246, ${opacity})`,
    `rgba(14, 165, 233, ${opacity})`,
  ];
  
  return colors[level % colors.length];
};

export default memo(CustomNode);