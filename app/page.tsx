"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { DecisionNode } from "@/components/decision-node";

const nodeTypes = { decision: DecisionNode };

let idCounter = 1;
const nextId = () => `node-${idCounter++}`;

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: "node-0",
      type: "decision",
      position: { x: 250, y: 50 },
      data: { label: "Start", prompt: "Is this a support request?" },
    },
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback((connection: Connection) => {
    const isYes = connection.sourceHandle === "yes";
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          id: `e-${connection.source}-${connection.sourceHandle}-${connection.target}`,
          label: isYes ? "YES" : "NO",
          style: { stroke: isYes ? "#16a34a" : "#dc2626" },
          data: { edgeType: isYes ? "yes" : "no" },
        },
        eds
      )
    );
  }, []);

  const handlePromptChange = useCallback((id: string, value: string) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, prompt: value } } : n))
    );
  }, []);

  // inject the change handler into every node's data
  const nodesWithHandlers = nodes.map((n) => ({
    ...n,
    data: { ...n.data, onPromptChange: handlePromptChange },
  }));

  const addNode = () => {
    const id = nextId();
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: "decision",
        position: { x: 250 + Math.random() * 200, y: 200 + nds.length * 120 },
        data: { label: `Node ${id}`, prompt: "" },
      },
    ]);
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-3 border-b flex gap-2 items-center">
        <h1 className="font-semibold text-lg mr-4">AI Workflow Builder</h1>
        <Button onClick={addNode} size="sm">+ Add Node</Button>
      </div>
      <div className="flex-1">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}