import { inngest } from "./inngest";
import { openai, MODEL } from "./openai";
import { saveRunResult } from "./run-store";
type WorkflowNode = {
    id: string;
    prompt: string;
    label: string;
};

type WorkflowEdge = {
    source: string;
    sourceHandle: "yes" | "no";
    target: string;
};

type WorkflowPayload = {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    startNodeId: string;
};

export const runWorkflow = inngest.createFunction(
    { id: "run-workflow", triggers: [{ event: "workflow/run" }] },
    async ({ event, step }) => {
        const { nodes, edges, startNodeId } = event.data as WorkflowPayload;

        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const executionLog: { nodeId: string; prompt: string; answer: string }[] = [];

        let currentNodeId: string | undefined = startNodeId;
        let safetyCounter = 0;

        while (currentNodeId && safetyCounter < 20) {
            safetyCounter++;
            const node = nodeMap.get(currentNodeId);
            if (!node) break;

            const nodeIdForStep = currentNodeId;

            const answer = await step.run(`ask-${nodeIdForStep}`, async () => {
                const completion = await openai.chat.completions.create({
                    model: MODEL,
                    messages: [
                        {
                            role: "system",
                            content:
                                "You answer only with the single word YES or NO, nothing else, no punctuation, no explanation.",
                        },
                        { role: "user", content: node.prompt },
                    ],
                    temperature: 0,
                });

                const raw = completion.choices[0].message.content?.trim().toUpperCase() ?? "";
                return raw.includes("YES") ? "YES" : "NO";
            });

            executionLog.push({ nodeId: node.id, prompt: node.prompt, answer });

            const wantedHandle = answer === "YES" ? "yes" : "no";
            const nextEdge = edges.find(
                (e) => e.source === currentNodeId && e.sourceHandle === wantedHandle
            );
            currentNodeId = nextEdge?.target;
        }

        await step.run("save-result", async () => {
            saveRunResult(event.id as string, { executionLog });
        });

        return { executionLog };
    }
);