"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export function DecisionNode({ data, id }: NodeProps) {
    const nodeData = data as { prompt: string; label: string; onPromptChange?: (id: string, value: string) => void };

    return (
        <Card className="p-3 w-64 border-2">
            <div className="text-xs font-semibold mb-2 text-muted-foreground">
                {nodeData.label || "Decision"}
            </div>
            <Textarea
                placeholder="e.g. Is this a support request?"
                value={nodeData.prompt}
                onChange={(e) => nodeData.onPromptChange?.(id, e.target.value)}
                className="text-sm resize-none"
                rows={3}
            />

            <Handle type="target" position={Position.Top} />

            <div className="flex justify-between mt-2 text-xs">
                <span className="text-green-600 font-medium">YES ↓</span>
                <span className="text-red-600 font-medium">NO ↓</span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="yes"
                style={{ left: "25%", background: "#16a34a" }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="no"
                style={{ left: "75%", background: "#dc2626" }}
            />
        </Card>
    );
}