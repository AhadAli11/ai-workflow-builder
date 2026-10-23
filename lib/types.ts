export type DecisionNodeData = {
    prompt: string;
    label: string;
};

export type EdgeType = "yes" | "no";

export type ExecutionLogEntry = { nodeId: string; prompt: string; answer: "YES" | "NO" };
export type NodeRunStatus = "idle" | "active" | "done";
