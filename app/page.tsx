"use client";

import { useCallback, useRef, useState } from "react";
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
import { ExecutionLogPanel } from "@/components/execution-log-panel";
import { ExecutionLogEntry } from "@/lib/types";

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

  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [fullLog, setFullLog] = useState<ExecutionLogEntry[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // --- replay animation: reveal the real log entries one at a time ---
  const playLog = (log: ExecutionLogEntry[]) => {
    setFullLog(log);
    setVisibleCount(0);
    let i = 0;
    const step = () => {
      if (i >= log.length) {
        setActiveNodeId(null);
        setIsRunning(false);
        return;
      }
      setActiveNodeId(log[i].nodeId);
      setVisibleCount(i + 1);
      i++;
      animTimer.current = setTimeout(step, 700);
    };
    step();
  };

  const pollStatus = (eventId: string, attempt = 0) => {
    if (attempt > 40) {
      setRunError("Timed out waiting for the workflow to finish.");
      setIsRunning(false);
      return;
    }

    fetch(`/api/workflow-status?eventId=${eventId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "Completed") {
          playLog((json.executionLog ?? []) as ExecutionLogEntry[]);
        } else if (json.status === "Failed" || json.status === "Cancelled") {
          setRunError(`Workflow ${json.status.toLowerCase()}. Check the Inngest dashboard for details.`);
          setIsRunning(false);
        } else {
          pollTimer.current = setTimeout(() => pollStatus(eventId, attempt + 1), 1500);
        }
      })
      .catch(() => {
        setRunError("Lost connection while checking workflow status.");
        setIsRunning(false);
      });
  }; const runWorkflowHandler = async () => {
    setRunError(null);
    setFullLog([]);
    setVisibleCount(0);
    setActiveNodeId(null);
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (animTimer.current) clearTimeout(animTimer.current);

    if (nodes.length === 0) {
      setRunError("Add at least one node before running.");
      return;
    }
    const emptyPrompt = nodes.find((n) => !(n.data as { prompt: string }).prompt?.trim());
    if (emptyPrompt) {
      setRunError(`Node "${emptyPrompt.id}" has an empty prompt. Fill in every node before running.`);
      return;
    }

    setIsRunning(true);

    const payload = {
      nodes: nodes.map((n) => ({
        id: n.id,
        prompt: (n.data as { prompt: string }).prompt,
        label: (n.data as { label: string }).label,
      })),
      edges: edges.map((e) => ({
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
      })),
      startNodeId: nodes[0].id,
    };

    try {
      const res = await fetch("/api/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to start workflow");
      const data = await res.json();
      pollStatus(data.eventId);
    } catch {
      setRunError("Could not reach the server to start the workflow.");
      setIsRunning(false);
    }
  };

  const doneNodeIds = new Set(fullLog.slice(0, visibleCount).map((e) => e.nodeId));
  const nodesWithHandlers = nodes.map((n) => ({
    ...n,
    data: {
      ...n.data,
      onPromptChange: handlePromptChange,
      status: n.id === activeNodeId ? "active" : doneNodeIds.has(n.id) ? "done" : "idle",
    },
  }));

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-3 border-b flex gap-2 items-center">
        <h1 className="font-semibold text-lg mr-4">AI Workflow Builder</h1>
        <Button onClick={addNode} size="sm">+ Add Node</Button>
        <Button onClick={runWorkflowHandler} size="sm" variant="default" disabled={isRunning}>
          {isRunning ? "Running..." : "▶ Run Workflow"}
        </Button>
      </div>

      {runError && (
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 border-b border-red-300">
          {runError}
        </div>
      )}

      <div className="flex-1 relative">
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
        <ExecutionLogPanel log={fullLog.slice(0, visibleCount)} />
      </div>
    </div>
  );
}