import {
  assertFileExists,
  currentBranch,
  currentHeadSha,
  git,
  latestOperationalReport,
  originMainSha,
  readJsonFile,
  readTextFile,
  requiredContinuityFiles,
  resolveRepoPath,
} from "./common.mjs";

function ensureCleanTree() {
  const status = git(["status", "--porcelain"]);

  if (status.length > 0) {
    throw new Error(
      "A árvore local está suja. Resolva o estado local antes de iniciar uma sessão de continuidade.",
    );
  }
}

function ensureContinuityFiles() {
  for (const file of requiredContinuityFiles) {
    assertFileExists(file);
    readTextFile(file);
  }
}

ensureCleanTree();
git(["fetch", "origin", "--prune"], { stdio: "inherit" });
ensureContinuityFiles();

const state = readJsonFile(".continuity/current-state.json");
const branch = currentBranch();
const headSha = currentHeadSha();
const mainSha = originMainSha();
const latestReport = state.last_report ?? latestOperationalReport() ?? "docs/operational-reports/TEMPLATE.md";

console.log("Session start check");
console.log(`- branch: ${branch}`);
console.log(`- head: ${headSha}`);
console.log(`- origin/main: ${mainSha}`);
console.log(`- active_branch registrada: ${state.active_branch}`);
console.log(`- fase atual: ${state.current_phase}`);
console.log(`- bloco ativo: ${state.active_block}`);
console.log(`- ultimo relatorio: ${latestReport}`);
console.log(`- handoff: ${resolveRepoPath("docs/HANDOFF.md")}`);
console.log(`- block plan: ${resolveRepoPath("docs/BLOCK_PLAN.md")}`);
console.log(`- remote state: ${resolveRepoPath("docs/REMOTE_STATE.md")}`);

if (state.active_branch !== branch) {
  console.log(
    `WARNING: a branch atual difere da active_branch registrada. Atualize a continuidade antes de seguir.`,
  );
}
