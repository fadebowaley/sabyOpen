import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from "lucide-react";
import { useFlowContext } from "@core/context/FlowContext";
import ConfirmPopover from "@core/components/ConfirmPopover";
import { useStructure } from "@hooks/useStructure";
import toast from "react-hot-toast";

const NodeDrawer = ({ isOpen, onClose, node, onDelete }) => {
  const { nodes, setNodes, addHistoryEntry } = useFlowContext();
  const { updateStructure } = useStructure();
  const [nodeData, setNodeData] = useState({
    name: "",
    type: "",
    description: "",
    active: false,
    special: false,
  });

  useEffect(() => {
    if (node) {
      setNodeData({
        name: node.data.name || "",
        type: node.data.type || "",
        description: node.data.description || "",
        active: node.data.active || false,
        special: node.data.special || false,
      });
    }
  }, [node]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setNodeData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Immediately update the node if it's a toggle change
    if (type === "checkbox" && node) {
      const updatedNodes = nodes.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            data: {
              ...n.data,
              [name]: checked,
            },
          };
        }
        return n;
      });
      setNodes(updatedNodes);
      addHistoryEntry(`Updated node ${name} status`);
    }
  };

  const handleSave = async () => {
    if (!node) return;
    console.log(
      "[NODE DRAWER - SAVE] Saving node:",
      node.id,
      "with data:",
      nodeData
    );

    // Update local state immediately
    const updatedNodes = nodes.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          data: {
            ...n.data,
            ...nodeData,
          },
        };
      }
      return n;
    });

    setNodes(updatedNodes);
    addHistoryEntry("Updated node properties");

    // Check if this is a NEW node (temp ID) or EXISTING node (database ID)
    const isNewNode = node.id.startsWith("node_");

    if (isNewNode) {
      // NEW NODE: Just update local state, will be saved when user clicks main Save button
      console.log(
        "[NODE DRAWER - SAVE] New node - changes saved locally. Click main 'Save' button to create in database."
      );
      toast.success(
        "Changes saved. Click 'Save' button to create in database."
      );
      onClose();
      return;
    }

    // EXISTING NODE: Update database immediately
    try {
      const structureId = node.data._id || node.id;
      console.log(
        "[NODE DRAWER - SAVE] Calling backend UPDATE for existing structure:",
        structureId
      );

      const payload = {
        name: nodeData.name,
        description: nodeData.description,
        isActive: nodeData.active,
        isSpecial: nodeData.special,
        position: node.position, // Save current position
      };

      const result = await updateStructure(structureId, payload);

      if (result.success) {
        console.log(
          "[NODE DRAWER - SAVE] ✅ Structure updated in database immediately"
        );
        toast.success("Changes saved to database");
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error("[NODE DRAWER - SAVE] Error updating structure:", error);
      toast.error("Failed to save changes to database");
    }

    onClose();
  };

  const handleDelete = () => {
    if (!node || !onDelete) return;
    console.log("[NODE DRAWER - DELETE] Deleting node:", node.id);
    onDelete(node.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-54 max-h-screen overflow-y-auto  h-124 w-64 bg-gray-800 shadow-lg z-55 border-l border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-medium text-danger-500">Node Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300 focus:outline-none">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {node ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={nodeData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={nodeData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-200 sm:text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-600 bg-gray-700/50">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Active
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Enable or disable this node
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleInputChange({
                      target: {
                        name: "active",
                        type: "checkbox",
                        checked: !nodeData.active,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    nodeData.active ? "bg-indigo-600" : "bg-gray-600"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      nodeData.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-600 bg-gray-700/50">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Special
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Mark as special node
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleInputChange({
                      target: {
                        name: "special",
                        type: "checkbox",
                        checked: !nodeData.special,
                      },
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    nodeData.special ? "bg-purple-600" : "bg-gray-600"
                  }`}>
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      nodeData.special ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between bg-gray-700 p-3 rounded-md border border-gray-600">
                <div>
                  <p className="text-sm font-medium text-gray-300">Level</p>
                  <p className="text-sm text-gray-400">
                    Auto-calculated: {node.data.level || 0}
                  </p>
                </div>
                <div
                  className="h-8 w-8 rounded-full"
                  style={{
                    backgroundColor: getLevelColor(node.data.level || 0, 0.2),
                    border: `2px solid ${getLevelColor(node.data.level || 0, 1)}`,
                  }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Select a node to view and edit its properties
          </div>
        )}
      </div>

      {node && (
        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center space-x-2 p-2 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors text-white">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>

          {onDelete && (
            <ConfirmPopover
              onConfirm={handleDelete}
              title="Delete Node"
              message={`Are you sure you want to delete "${node.data.name}"? This action cannot be undone.`}
              confirmText="Delete"
              cancelText="Cancel"
              trigger={
                <button className="w-full flex items-center justify-center space-x-2 p-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors text-white">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Node</span>
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
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

export default NodeDrawer;