import { existsSync } from "node:fs";
import {
  appendJsonLine,
  currentBranch,
  currentHeadSha,
  hostname,
  originMainSha,
  parseArgs,
  readJsonFile,
  renderHandoff,
  resolveRepoPath,
  toArray,
  utcTimestamp,
  writeJsonFile,
  writeTextFile,
} from "./common.mjs";

const args = parseArgs(process.argv.slice(2));
const status = args.status;
const report = args.report;
const nextAction = args["next-action"];

if (!status || !["partial", "complete"].includes(status)) {
  throw new Error("--status deve ser 'partial' ou 'complete'");
}

if (!report) {
  throw new Error("--report é obrigatório");
}

if (!nextAction) {
  throw new Error("--next-action é obrigatório");
}

const reportPath = resolveRepoPath(report);

if (!report.startsWith("docs/operational-reports/")) {
  throw new Error("--report deve apontar para um arquivo dentro de docs/operational-reports/");
}

if (!existsSync(reportPath)) {
  throw new Error(`O relatório informado não existe: ${report}`);
}

const state = readJsonFile(".continuity/current-state.json");
const branch = currentBranch();
const headSha = currentHeadSha();
const mainSha = originMainSha();
const timestamp = utcTimestamp();

state.last_integrated_main_sha = mainSha;
state.current_phase = args.phase ?? state.current_phase;
state.active_block = args.block ?? state.active_block;
state.active_branch = branch;
state.last_tool = args.tool ?? "CODEX";
state.last_machine = args.machine ?? hostname();
state.last_update_utc = timestamp;
state.next_action = nextAction;
state.session_status = status;
state.last_report = report;
state.last_session_head_sha = headSha;

const completedItems = toArray(args.completed);
const pendingItems = toArray(args.pending);
const blockers = toArray(args.blocker);
const notes = toArray(args.note);

if (completedItems) {
  state.completed_items = completedItems;
}

if (pendingItems) {
  state.pending_items = pendingItems;
}

if (blockers) {
  state.external_blockers = blockers;
}

if (notes) {
  state.notes = notes;
}

writeJsonFile(".continuity/current-state.json", state);
writeTextFile("docs/HANDOFF.md", renderHandoff(state));

appendJsonLine(".continuity/session-log.jsonl", {
  timestamp,
  event: "session_end",
  machine: state.last_machine,
  tool: state.last_tool,
  branch,
  head_sha: headSha,
  main_sha: mainSha,
  status,
  report,
});

console.log(`Continuity state updated for ${branch}`);
console.log(`- report: ${reportPath}`);
console.log(`- head: ${headSha}`);
