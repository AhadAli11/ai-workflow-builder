"use client";

import { Card } from "@/components/ui/card";
import { ExecutionLogEntry } from "@/lib/types";

export function ExecutionLogPanel({ log }: { log: ExecutionLogEntry[] }) {
    if (log.length === 0) return null;

    return (
        <Card className="absolute top-20 right-4 w-80 max-h-[70vh] overflow-y-auto p-3 z-10 bg-background/95 backdrop-blur">
            <div className="text-sm font-semibold mb-2">Execution Log</div>
            <div className="space-y-2">
                {log.map((entry, i) => (
                    <div key={i} className="text-xs border rounded p-2">
                        <div className="font-medium truncate">{entry.nodeId}</div>
                        <div className="text-muted-foreground truncate">{entry.prompt}</div>
                        <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-white text-[10px] font-bold ${entry.answer === "YES" ? "bg-green-600" : "bg-red-600"
                                }`}
                        >
                            {entry.answer}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}