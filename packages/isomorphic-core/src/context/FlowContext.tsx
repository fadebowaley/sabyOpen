"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Edge, Node } from "reactflow";

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  action: string;
}

interface FlowContextType {
  nodes: Node[];
  edges: Edge[];
  isDarkMode: boolean;
  history: HistoryEntry[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  toggleDarkMode: () => void;
  resetCanvas: () => void;
  updateNodeData: (nodeId: string, data: any) => void;
  deleteNode: (nodeId: string) => void;
  calculateHierarchyLevels: () => void;
  addHistoryEntry: (action: string) => void;
  undo: () => void;
  redo: () => void;
  loadStructuresFromBackend: (structures: any[], levels: any[]) => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const useFlowContext = () => {
  const context = useContext(FlowContext);
  if (context === undefined) {
    throw new Error("useFlowContext must be used within a FlowProvider");
  }
  return context;
};

export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  // NO localStorage - Everything loads from database only
  // This ensures fresh data on every page load
  useEffect(() => {
    console.log(
      "[FLOW CONTEXT - INIT] FlowContext initialized - DATABASE-ONLY mode (no localStorage)"
    );
  }, []);

  // Debug: Log whenever nodes state changes
  useEffect(() => {
    console.log(
      "[FLOW CONTEXT - STATE] Nodes state changed. Count:",
      nodes.length
    );
    if (nodes.length > 0) {
      console.log("[FLOW CONTEXT - STATE] First node:", nodes[0]);
      console.log("[FLOW CONTEXT - STATE] First node ID:", nodes[0]?.id);
    }
  }, [nodes]);

  // Debug: Log whenever edges state changes
  useEffect(() => {
    console.log(
      "[FLOW CONTEXT - STATE] Edges state changed. Count:",
      edges.length
    );
  }, [edges]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
    addHistoryEntry("Changed theme");
  }, []);

  const addHistoryEntry = useCallback(
    (action: string) => {
      const newEntry: HistoryEntry = {
        nodes: [...nodes],
        edges: [...edges],
        timestamp: Date.now(),
        action,
      };

      setHistory((prev) => {
        // Remove all entries after current index if we're in middle of history
        const newHistory = prev.slice(0, currentHistoryIndex + 1);
        return [...newHistory, newEntry];
      });
      setCurrentHistoryIndex((prev) => prev + 1);
    },
    [nodes, edges, currentHistoryIndex]
  );

  const undo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setCurrentHistoryIndex((prev) => prev - 1);
    }
  }, [history, currentHistoryIndex]);

  const redo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setCurrentHistoryIndex((prev) => prev + 1);
    }
  }, [history, currentHistoryIndex]);

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
          }
          return node;
        })
      );
      addHistoryEntry(`Updated node ${nodeId}`);
    },
    [addHistoryEntry]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      console.log("[FLOW CONTEXT - DELETE NODE] Deleting node ID:", nodeId);
      setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
      setEdges((prevEdges) =>
        prevEdges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        )
      );
      addHistoryEntry(`Deleted node ${nodeId}`);
      console.log(
        "[FLOW CONTEXT - DELETE NODE] Node and connected edges deleted"
      );
    },
    [addHistoryEntry]
  );

  const loadStructuresFromBackend = useCallback(
    (structures: any[], levels: any[]) => {
      console.log(
        "[FLOW CONTEXT - LOAD] Loading structures:",
        structures.length,
        "levels:",
        levels.length
      );
      console.log("[FLOW CONTEXT - LOAD] First structure raw:", structures[0]);

      // Create a map of structure IDs to positions (for layout)
      const levelGroups = new Map<number, any[]>();
      structures.forEach((struct) => {
        const levelRank = struct.level?.rank || 0;
        if (!levelGroups.has(levelRank)) {
          levelGroups.set(levelRank, []);
        }
        levelGroups.get(levelRank)!.push(struct);
      });

      // Convert structures to nodes with proper positioning
      const newNodes: Node[] = structures
        .map((structure, index) => {
          const levelRank = structure.level?.rank || 0;
          const levelStructures = levelGroups.get(levelRank) || [];
          const indexInLevel = levelStructures.indexOf(structure);

          // CRITICAL FIX: toJSON plugin converts _id → id (string)
          const structureId = structure.id || structure._id;

          if (!structureId) {
            console.error(
              "[FLOW CONTEXT - LOAD] ERROR: Structure has no ID!",
              structure
            );
            return null; // Skip invalid structures
          }

          // Use saved position if available, otherwise auto-calculate
          const position = structure.position || {
            x: 100 + indexInLevel * 300,
            y: 100 + levelRank * 200,
          };

          const node = {
            id: structureId.toString(), // Ensure it's a string
            type: "customNode",
            position: position,
            data: {
              name: structure.name,
              type: structure.type || "administrative",
              level: levelRank,
              description: structure.description || "",
              active: structure.isActive || false,
              special: structure.isSpecial || false,
              _id: structureId.toString(),
            },
            draggable: true,
          };

          console.log(
            `[FLOW CONTEXT - LOAD] Created node "${structure.name}" with ID:`,
            structureId
          );
          return node;
        })
        .filter(Boolean); // Remove null entries

      // Convert parent relationships to edges
      console.log("[FLOW CONTEXT - LOAD] Creating edges from structures...");
      console.log("[FLOW CONTEXT - LOAD] Total structures:", structures.length);
      console.log(
        "[FLOW CONTEXT - LOAD] Structures with parent:",
        structures.filter((s) => s.parent).length
      );

      const newEdges: Edge[] = structures
        .filter((structure) => {
          const hasParent = !!structure.parent;
          console.log(
            `[FLOW CONTEXT - LOAD] Structure "${structure.name}" has parent:`,
            hasParent,
            structure.parent
          );
          return hasParent;
        })
        .map((structure) => {
          // Handle parent as: ObjectId, string, or object with id/_id
          let parentId;

          if (typeof structure.parent === "string") {
            parentId = structure.parent;
          } else if (structure.parent && typeof structure.parent === "object") {
            // Check if it's a plain object with id or _id
            parentId =
              structure.parent.id ||
              structure.parent._id ||
              structure.parent.toString();
          } else {
            // Might be ObjectId - convert to string
            parentId = structure.parent ? structure.parent.toString() : null;
          }

          const structureId = structure.id || structure._id;

          console.log("[FLOW CONTEXT - LOAD] Processing edge:", {
            structureName: structure.name,
            structureId,
            parentRaw: structure.parent,
            parentType: typeof structure.parent,
            parentExtracted: parentId,
            hasParent: !!structure.parent,
          });

          if (!parentId || !structureId) {
            console.error(
              "[FLOW CONTEXT - LOAD] ❌ FAILED to create edge - missing IDs:",
              {
                parentId,
                structureId,
                structure: structure.name,
                parentRaw: structure.parent,
              }
            );
            return null;
          }

          const edge = {
            id: `e${parentId}-${structureId}`,
            source: parentId.toString(),
            target: structureId.toString(),
            type: "default", // Smooth straight lines
            animated: true,
            style: {
              stroke: "#6366f1",
              strokeWidth: 3,
              filter: "drop-shadow(0 0 4px #6366f1)",
            },
          };

          console.log("[FLOW CONTEXT - LOAD] ✅ Successfully created edge:", {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
          });
          return edge;
        })
        .filter(Boolean); // Remove null entries

      console.log("[FLOW CONTEXT - LOAD] Final nodes array:", newNodes);
      console.log("[FLOW CONTEXT - LOAD] Final edges array:", newEdges);
      console.log(
        "[FLOW CONTEXT - LOAD] Setting state with",
        newNodes.length,
        "nodes"
      );

      setNodes(newNodes);
      setEdges(newEdges);
      addHistoryEntry("Loaded structures from backend");

      console.log(
        "[FLOW CONTEXT - LOAD] ✅ State updated - nodes should now be visible"
      );
    },
    [addHistoryEntry]
  );

  const calculateHierarchyLevels = useCallback(() => {
    const nodeWithIncomingEdges = new Set(edges.map((edge) => edge.target));
    const rootNodes = nodes.filter(
      (node) => !nodeWithIncomingEdges.has(node.id)
    );
    const nodeLevels = new Map(nodes.map((node) => [node.id, -1]));

    rootNodes.forEach((node) => {
      nodeLevels.set(node.id, 0);
    });

    const adjacencyList = new Map();
    nodes.forEach((node) => {
      adjacencyList.set(node.id, []);
    });

    edges.forEach((edge) => {
      const sourceId = edge.source;
      const targetId = edge.target;

      if (adjacencyList.has(sourceId)) {
        adjacencyList.get(sourceId).push(targetId);
      }
    });

    const queue = [...rootNodes.map((node) => node.id)];
    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const currentLevel = nodeLevels.get(currentNodeId);

      const children = adjacencyList.get(currentNodeId) || [];
      children.forEach((childId) => {
        const childCurrentLevel = nodeLevels.get(childId);
        const newChildLevel = currentLevel + 1;

        if (childCurrentLevel === -1 || newChildLevel > childCurrentLevel) {
          nodeLevels.set(childId, newChildLevel);
          queue.push(childId);
        }
      });
    }

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const level =
          nodeLevels.get(node.id) === -1 ? 0 : nodeLevels.get(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            level,
          },
        };
      })
    );
  }, [nodes, edges]);

  const resetCanvas = () => {
    setNodes([]);
    setEdges([]);
    setHistory([]);
  };

  const value = {
    nodes,
    setNodes,
    edges,
    setEdges,
    isDarkMode,
    history,
    toggleDarkMode,
    updateNodeData,
    deleteNode,
    calculateHierarchyLevels,
    addHistoryEntry,
    undo,
    redo,
    resetCanvas,
    loadStructuresFromBackend,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};
