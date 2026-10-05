"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Connection,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
  BackgroundVariant,
  OnNodesChange,
  applyNodeChanges,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Sun,
  Moon,
  Undo,
  Redo,
  Save,
  History,
  ArrowRight,
  Upload,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";

import Sidebar from "@core/components/Sidebar";
import NodeDrawer from "@core/components/NodeDrawer";
import CustomNode from "@core/components/nodes/CustomNode";
import HistoryPanel from "@core/components/HistoryPanel";
import { useFlowContext } from "@core/context/FlowContext";
import { useSubmitStructure } from "@hooks/useSubmitStructure";
import { useStructure } from "@hooks/useStructure";
import { Badge, Box, Button, Flex, Input, Text, Title } from "rizzui";
import { PiDiceSixBold, PiArrowCircleRightBold } from "react-icons/pi";
import ConfirmPopover from "@core/components/ConfirmPopover";

const nodeTypes = {
  customNode: CustomNode,
};

const FlowBuilder = () => {
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    calculateHierarchyLevels,
    isDarkMode,
    toggleDarkMode,
    undo,
    redo,
    addHistoryEntry,
    deleteNode,
    loadStructuresFromBackend,
  } = useFlowContext();

  const [selectedNode, setSelectedNode] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { submitStructure } = useSubmitStructure();
  const {
    getStructures,
    deleteStructure,
    updateStructure,
    loading: structuresLoading,
  } = useStructure();
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Automatically load structures on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (hasLoadedInitialData) return; // Prevent duplicate loads

      console.log(
        "[FLOW BUILDER - INIT] Automatically loading structures from database..."
      );
      try {
        const response = await getStructures();
        if (response.success && response.data?.results) {
          console.log(
            "[FLOW BUILDER - INIT] Auto-loaded",
            response.data.results.length,
            "structures"
          );
          console.log(
            "[FLOW BUILDER - INIT] Raw structures data:",
            response.data.results
          );
          console.log(
            "[FLOW BUILDER - INIT] First structure parent:",
            response.data.results[0]?.parent
          );
          console.log(
            "[FLOW BUILDER - INIT] Structures with parents:",
            response.data.results
              .filter((s) => s.parent)
              .map((s) => ({
                name: s.name,
                parent: s.parent,
                parentType: typeof s.parent,
              }))
          );
          loadStructuresFromBackend(response.data.results, []);
          setHasLoadedInitialData(true);

          if (response.data.results.length > 0) {
            toast.success(
              `Auto-loaded ${response.data.results.length} structures`
            );
          }
        } else {
          console.log("[FLOW BUILDER - INIT] No structures found in database");
        }
      } catch (error) {
        console.error(
          "[FLOW BUILDER - INIT] Error auto-loading structures:",
          error
        );
        // Don't show error toast on initial load to avoid being intrusive
      }
    };

    loadInitialData();
  }, [getStructures, loadStructuresFromBackend, hasLoadedInitialData]);

  // Debug: Log when nodes prop changes
  useEffect(() => {
    console.log(
      "[FLOW BUILDER - RENDER] Component received nodes. Count:",
      nodes.length
    );
    if (nodes.length > 0) {
      console.log("[FLOW BUILDER - RENDER] First node:", nodes[0]);
      console.log(
        "[FLOW BUILDER - RENDER] All node IDs:",
        nodes.map((n) => n.id)
      );
    }
  }, [nodes]);

  // Debug: Log when edges prop changes
  useEffect(() => {
    console.log(
      "[FLOW BUILDER - RENDER] Component received edges. Count:",
      edges.length
    );
    if (edges.length > 0) {
      console.log("[FLOW BUILDER - RENDER] First edge:", edges[0]);
      console.log(
        "[FLOW BUILDER - RENDER] All edges:",
        edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
        }))
      );
    } else if (nodes.length > 0) {
      console.warn(
        "[FLOW BUILDER - RENDER] ⚠️ WARNING: Nodes exist but NO EDGES!"
      );
      console.warn(
        "[FLOW BUILDER - RENDER] Check if parent relationships exist in data"
      );
    }
  }, [edges, nodes.length]);

  const onNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(changes, nds);

        // Check if any node was dragged (position changed)
        changes.forEach(async (change) => {
          if (
            change.type === "position" &&
            change.dragging === false &&
            change.position
          ) {
            // Node drag ended - save position to database
            const node = updatedNodes.find((n) => n.id === change.id);
            if (node) {
              // Check if this is an EXISTING node (not a temp node)
              const isNewNode = node.id.startsWith("node_");

              if (isNewNode) {
                console.log(
                  "[FLOW BUILDER - DRAG] New node repositioned locally. Position will be saved when you click main 'Save' button."
                );
                return; // Don't call API for temp nodes
              }

              // EXISTING NODE: Save position to database
              const structureId = node.data._id || node.id;
              console.log(
                "[FLOW BUILDER - DRAG] Saving new position for:",
                node.data.name,
                change.position
              );

              try {
                await updateStructure(structureId, {
                  position: change.position,
                });
                console.log(
                  "[FLOW BUILDER - DRAG] ✅ Position saved to database"
                );
                toast.success(`Position saved for ${node.data.name}`);
              } catch (error) {
                console.error(
                  "[FLOW BUILDER - DRAG] Error saving position:",
                  error
                );
                toast.error("Failed to save position");
              }
            }
          }
        });

        return updatedNodes;
      });
    },
    [setNodes, updateStructure]
  );

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => {
        const newEdges = addEdge(
          {
            ...params,
            type: "bezier",
            animated: true,
            style: { stroke: "#94a3b8", strokeWidth: 4 },
          },
          eds
        );
        setTimeout(() => calculateHierarchyLevels(), 0);
        addHistoryEntry("Connected nodes");
        return newEdges;
      });
    },
    [setEdges, calculateHierarchyLevels, addHistoryEntry]
  );

  const onNodeClick = useCallback((_, node) => {
    console.log(
      "[FLOW BUILDER - NODE CLICK] Node clicked:",
      node.id,
      node.data.name
    );
    setSelectedNode(node);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setTimeout(() => calculateHierarchyLevels(), 0);
    setIsDrawerOpen(false);
    setSelectedNode(null);
  }, [calculateHierarchyLevels]);

  // const onDrop = useCallback(
  //   (event) => {
  //     event.preventDefault();
  //     if (reactFlowInstance) {
  //       const reactFlowBounds =
  //         reactFlowWrapper.current.getBoundingClientRect();
  //       const type = event.dataTransfer.getData("application/reactflow");

  //       if (typeof type === "undefined" || !type) {
  //         return;
  //       }

  //       const position = reactFlowInstance.screenToFlowPosition({
  //         x: event.clientX - reactFlowBounds.left,
  //         y: event.clientY - reactFlowBounds.top,
  //       });

  //       const newNode = {
  //         id: `node_${Date.now()}`,
  //         type: "customNode",
  //         position,
  //         data: {
  //           name: `New ${type}`,
  //           type: type,
  //           level: 0,
  //           description: "",
  //           active: false,
  //           special: false,
  //         },
  //         draggable: true,
  //       };

  //       setNodes((nds) => {
  //         const updatedNodes = nds.concat(newNode);
  //         setTimeout(() => calculateHierarchyLevels(), 0);
  //         addHistoryEntry("Added new node");
  //         return updatedNodes;
  //       });
  //     }
  //   },
  //   [reactFlowInstance, setNodes, calculateHierarchyLevels, addHistoryEntry]
  // );

  // ...existing code...
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (!type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type: "customNode",
        position,
        data: {
          name: `New ${type}`,
          type,
          level: 0,
          description: "",
          active: false,
          special: false,
        },
        draggable: true,
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        setTimeout(() => calculateHierarchyLevels(), 0);
        addHistoryEntry("Added new node");
        return updatedNodes;
      });
    },
    [
      reactFlowInstance,
      setNodes,
      calculateHierarchyLevels,
      addHistoryEntry,
      reactFlowWrapper,
    ]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const exportToJson = useCallback(() => {
    if (!reactFlowInstance) return;

    const flowData = {
      structures: nodes.map((node) => ({
        tempId: node.id,
        name: node.data.name,
        code: node.data.type,
        type: node.data.type,
        description: node.data.description,
        levelRank: node.data.level,
        parentTempId:
          edges.find((edge) => edge.target === node.id)?.source || null,
        active: node.data.active || false,
        special: node.data.special || false,
      })),
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flow_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    addHistoryEntry("Exported flow to JSON");
  }, [reactFlowInstance, nodes, edges, addHistoryEntry]);

  const importFromJson = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          const newNodes = jsonData.structures.map((structure) => ({
            id: structure.tempId,
            type: "customNode",
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
              name: structure.name,
              type: structure.type,
              level: structure.levelRank,
              description: structure.description,
              active: structure.active || false,
              special: structure.special || false,
            },
            draggable: true,
          }));

          const newEdges = jsonData.structures
            .filter((structure) => structure.parentTempId)
            .map((structure) => ({
              id: `e${structure.parentTempId}-${structure.tempId}`,
              source: structure.parentTempId,
              target: structure.tempId,
              type: "smoothstep",
              animated: true,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            }));

          setNodes(newNodes);
          setEdges(newEdges);
          setTimeout(() => calculateHierarchyLevels(), 0);
          addHistoryEntry("Imported flow from JSON");
        } catch (error) {
          console.error("Error importing JSON:", error);
        }
      };
      reader.readAsText(file);
    },
    [setNodes, setEdges, calculateHierarchyLevels, addHistoryEntry]
  );

  const handleSave = useCallback(async () => {
    if (!reactFlowInstance) return;

    // Filter only NEW nodes (those with temp IDs starting with 'node_')
    const newNodes = nodes.filter((node) => node.id.startsWith("node_"));
    const existingNodes = nodes.filter((node) => !node.id.startsWith("node_"));

    console.log(
      "[FLOW BUILDER - SAVE] Total nodes:",
      nodes.length,
      "| New:",
      newNodes.length,
      "| Existing:",
      existingNodes.length
    );

    if (newNodes.length === 0) {
      toast.info(
        "No new structures to save. Use 'Save Changes' in node drawer to update existing ones."
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => calculateHierarchyLevels(), 0);

    try {
      // Only save new nodes
      const result = await submitStructure(newNodes, edges);
      console.log(
        "[FLOW BUILDER - SAVE] New structures saved successfully:",
        result
      );
      toast.success(`${newNodes.length} new structure(s) saved to database!`);

      // Reload from backend to get real IDs
      setTimeout(async () => {
        const response = await getStructures();
        if (response.success && response.data?.results) {
          loadStructuresFromBackend(response.data.results, []);
          toast.success("Reloaded with database IDs");
        }
      }, 1000);
    } catch (error) {
      console.error("[FLOW BUILDER - SAVE] Error saving structure:", error);
      toast.error("Failed to save structure.");
    } finally {
      setIsLoading(false);
    }
  }, [
    reactFlowInstance,
    submitStructure,
    getStructures,
    loadStructuresFromBackend,
    nodes,
    edges,
    calculateHierarchyLevels,
  ]);

  const handleLoad = useCallback(async () => {
    console.log("[FLOW BUILDER - LOAD] Loading structures from backend...");
    try {
      const response = await getStructures();
      if (response.success && response.data?.results) {
        console.log(
          "[FLOW BUILDER - LOAD] Fetched",
          response.data.results.length,
          "structures"
        );
        loadStructuresFromBackend(response.data.results, []);
        toast.success(`Loaded ${response.data.results.length} structures`);
      } else {
        console.warn("[FLOW BUILDER - LOAD] No structures found");
        toast.info("No structures found");
      }
    } catch (error) {
      console.error("[FLOW BUILDER - LOAD] Error loading structures:", error);
      toast.error("Failed to load structures");
    }
  }, [getStructures, loadStructuresFromBackend]);

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      console.log("[FLOW BUILDER - DELETE] Deleting node:", nodeId);

      // Find the node to get its database ID
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      const structureId = nodeToDelete?.data?._id || nodeId;

      try {
        // Delete from backend first
        console.log(
          "[FLOW BUILDER - DELETE] Calling backend DELETE for structure:",
          structureId
        );
        const result = await deleteStructure(structureId);

        if (result.success) {
          // Then remove from local state
          deleteNode(nodeId);
          toast.success("Structure deleted successfully from database");
          console.log(
            "[FLOW BUILDER - DELETE] Structure deleted from database and canvas"
          );
        } else {
          toast.error("Failed to delete structure from database");
        }
      } catch (error) {
        console.error(
          "[FLOW BUILDER - DELETE] Error deleting structure:",
          error
        );
        toast.error("Failed to delete structure");
      }
    },
    [deleteNode, deleteStructure, nodes]
  );

  return (
    <div className={`flex h-full ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <div className="absolute top-4 right-23 z-10 flex items-center space-x-2">
          <button
            onClick={toggleDarkMode}
            className={`p-2 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } rounded-lg transition-colors border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            title="Toggle theme">
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={undo}
            className={`p-2 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } rounded-lg transition-colors border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            title="Undo">
            <Undo
              className={`w-5 h-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={redo}
            className={`p-2 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } rounded-lg transition-colors border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            title="Redo">
            <Redo
              className={`w-5 h-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={exportToJson}
            className={`p-2 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } rounded-lg transition-colors border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            title="Export">
            <Download
              className={`w-5 h-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={importFromJson}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 ${
              isDarkMode
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-white hover:bg-gray-100"
            } rounded-lg transition-colors border ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
            title="Import">
            <Upload
              className={`w-5 h-5 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </button>
          <button
            onClick={handleLoad}
            disabled={structuresLoading}
            className={`p-2 ${
              isDarkMode
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-indigo-500 hover:bg-indigo-600"
            } rounded-lg transition-colors border border-transparent text-white font-medium px-4`}
            title="Load from Database">
            {structuresLoading ? "Loading..." : "Load Data"}
          </button>
          {nodes.length > 0 && (
            <div className="right-2  z-50 ">
              <ConfirmPopover
                onConfirm={handleSave}
                isLoading={isLoading}
                title="Save Structure"
                message="Do you want to save the current structure?"
                confirmText="Save"
                cancelText="Cancel"
                trigger={
                  <Button size="xl" variant="solid" className="h-9 w-full">
                    <span>Click Save</span>
                    <PiArrowCircleRightBold className="h-4 w-4 ml-2" />
                  </Button>
                }
              />
            </div>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={() => {}}
          onConnect={onConnect}
          onInit={(instance) => {
            setReactFlowInstance(instance);
            // Auto fit view when initialized with nodes
            setTimeout(() => {
              if (nodes.length > 0) {
                instance.fitView({ padding: 0.2, duration: 800 });
                console.log(
                  "[FLOW BUILDER - INIT] Auto-fitted view for",
                  nodes.length,
                  "nodes"
                );
              }
            }, 100);
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          attributionPosition="bottom-right"
          connectionLineType={ConnectionLineType.Bezier}
          className={isDarkMode ? "bg-gray-900" : "bg-white"}
          defaultEdgeOptions={{
            type: "default",
            animated: true,
            style: {
              stroke: "#6366f1",
              strokeWidth: 3,
              filter: "drop-shadow(0 0 4px #6366f1)",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#6366f1",
            },
          }}

          // defaultEdgeOptions={{
          //   type: "bezier",
          //   animated: true,
          //   // style: { stroke: "#94a3b8", strokeWidth: 4 },
          //   style: {
          //     stroke: "#00ffff00", // Transparent stroke
          //     strokeWidth: 4,
          //     filter: "drop-shadow(0 0 6pxrgb(0, 0, 0))",
          //   },
          //   markerEnd: {
          //     type: MarkerType.ArrowClosed,
          //     color: "#00ffff",
          //   },
          // }}
        >
          <Background
            variant={BackgroundVariant.Cross}
            gap={6}
            size={2}
            color={isDarkMode ? "#374151" : "#e5e7eb"}
            className={isDarkMode ? "bg-gray-900" : "bg-white"}
          />
        </ReactFlow>
      </div>
      <Sidebar />
      <HistoryPanel />
      <NodeDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        node={selectedNode}
        onDelete={handleDeleteNode}
      />
    </div>
  );
};

export default FlowBuilder;
