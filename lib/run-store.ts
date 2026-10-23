import fs from "fs";
import path from "path";

const STORE_DIR = path.join(process.cwd(), ".run-results");

function fileFor(eventId: string) {
    return path.join(STORE_DIR, `${eventId.replace(/[^a-zA-Z0-9_-]/g, "")}.json`);
}

export function saveRunResult(eventId: string, result: unknown) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(fileFor(eventId), JSON.stringify(result));
}

export function readRunResult(eventId: string): unknown | null {
    try {
        return JSON.parse(fs.readFileSync(fileFor(eventId), "utf-8"));
    } catch {
        return null;
    }
}