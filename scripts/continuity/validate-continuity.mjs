import { existsSync } from "node:fs";
import {
  assertFileExists,
  currentBranch,
  readJsonFile,
  readSessionLog,
  readTextFile,
  requiredContinuityFiles,
  resolveRepoPath,
} from "./common.mjs";

const state = readJsonFile(".continuity/current-state.json");
const logEntries = readSessionLog();
const handoff = readTextFile("docs/HANDOFF.md");

for (const file of requiredContinuityFiles) {
  assertFileExists(file);
}

const requiredStringFields = [
  "source_of_truth",
  "project",
  "last_integrated_main_sha",
  "current_phase",
  "active_block",
  "active_branch",
  "last_tool",
  "last_machine",
  "last_update_utc",
  "next_action",
];

for (const field of requiredStringFields) {
  if (typeof state[field] !== "string" || state[field].trim().length === 0) {
    throw new Error(`Campo obrigatório inválido em .continuity/current-state.json: ${field}`);
  }
}

const requiredArrayFields = ["completed_items", "pending_items", "external_blockers", "notes"];

for (const field of requiredArrayFields) {
  if (!Array.isArray(state[field])) {
    throw new Error(`Campo obrigatório inválido em .continuity/current-state.json: ${field}`);
  }
}

if (typeof state.protocol_version !== "number") {
  throw new Error("protocol_version deve ser numérico em .continuity/current-state.json");
}

if (typeof state.session_status !== "string" || state.session_status.trim().length === 0) {
  throw new Error("session_status deve ser preenchido em .continuity/current-state.json");
}

if (typeof state.last_report === "string" && state.last_report.length > 0) {
  if (!existsSync(resolveRepoPath(state.last_report))) {
    throw new Error(`Relatório referenciado em current-state não existe: ${state.last_report}`);
  }
}

if (!handoff.includes(state.active_branch)) {
  throw new Error("docs/HANDOFF.md não referencia a active_branch atual");
}

if (!handoff.includes(state.last_integrated_main_sha)) {
  throw new Error("docs/HANDOFF.md não referencia o commit de base oficial atual");
}

const requiredHandoffMarkers = [
  "## Preambulo obrigatório para qualquer IA",
  "docs/BLOCK_PLAN.md",
  "docs/REMOTE_STATE.md",
];

for (const marker of requiredHandoffMarkers) {
  if (!handoff.includes(marker)) {
    throw new Error(`docs/HANDOFF.md não contém o marcador obrigatório: ${marker}`);
  }
}

if (logEntries.length === 0) {
  throw new Error(".continuity/session-log.jsonl não pode ficar vazio");
}

for (const [index, entry] of logEntries.entries()) {
  if (typeof entry.timestamp !== "string" || typeof entry.event !== "string") {
    throw new Error(`Linha inválida no session-log.jsonl: índice ${index}`);
  }
}

const branch = currentBranch();

if (branch.startsWith("session/") && state.active_branch !== branch) {
  throw new Error(
    `A branch local (${branch}) diverge da active_branch registrada (${state.active_branch})`,
  );
}

console.log(`Continuity check ok for ${branch}`);
