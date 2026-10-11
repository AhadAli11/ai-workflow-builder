import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { runWorkflow } from "@/lib/workflow-function";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [runWorkflow],
});