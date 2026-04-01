import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();

export const requiredContinuityFiles = [
  ".continuity/current-state.json",
  ".continuity/session-log.jsonl",
  ".continuity/UNIVERSAL_SESSION_PROMPT.md",
  "docs/CONTINUITY_PROTOCOL.md",
  "docs/HANDOFF.md",
  "docs/MIGRATION_STATUS.md",
  "docs/operational-reports/TEMPLATE.md",
];

export function git(args, options = {}) {
  const result = execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });

  return typeof result === "string" ? result.trim() : "";
}

export function resolveRepoPath(...segments) {
  return path.join(repoRoot, ...segments);
}

export function ensureDirectoryForFile(relativePath) {
  const directory = path.dirname(resolveRepoPath(relativePath));
  mkdirSync(directory, { recursive: true });
}

export function readTextFile(relativePath) {
  return readFileSync(resolveRepoPath(relativePath), "utf8");
}

export function writeTextFile(relativePath, content) {
  ensureDirectoryForFile(relativePath);
  writeFileSync(resolveRepoPath(relativePath), content, "utf8");
}

export function readJsonFile(relativePath) {
  return JSON.parse(readTextFile(relativePath));
}

export function writeJsonFile(relativePath, value) {
  writeTextFile(relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function appendJsonLine(relativePath, value) {
  ensureDirectoryForFile(relativePath);
  const payload = `${JSON.stringify(value)}\n`;
  writeFileSync(resolveRepoPath(relativePath), payload, {
    encoding: "utf8",
    flag: "a",
  });
}

export function parseArgs(argv) {
  const parsed = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    if (Object.hasOwn(parsed, key)) {
      const current = parsed[key];
      parsed[key] = Array.isArray(current) ? [...current, next] : [current, next];
    } else {
      parsed[key] = next;
    }

    index += 1;
  }

  return parsed;
}

export function toArray(value) {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value : [value];
}

export function currentBranch() {
  return git(["rev-parse", "--abbrev-ref", "HEAD"]);
}

export function currentHeadSha() {
  return git(["rev-parse", "HEAD"]);
}

export function originMainSha() {
  return git(["rev-parse", "origin/main"]);
}

export function hostname() {
  return os.hostname().toUpperCase();
}

export function utcTimestamp() {
  return new Date().toISOString();
}

export function todayUtc() {
  return utcTimestamp().slice(0, 10);
}

export function listOperationalReports() {
  const reportsDirectory = resolveRepoPath("docs", "operational-reports");
  const entries = readdirSync(reportsDirectory)
    .filter((entry) => entry.toLowerCase().endsWith(".md") && entry !== "TEMPLATE.md")
    .map((entry) => {
      const relativePath = path.posix.join("docs", "operational-reports", entry);
      return {
        entry,
        relativePath,
        updatedAt: statSync(path.join(reportsDirectory, entry)).mtimeMs,
      };
    })
    .sort((left, right) => right.updatedAt - left.updatedAt || right.entry.localeCompare(left.entry));

  return entries;
}

export function latestOperationalReport() {
  return listOperationalReports()[0]?.relativePath ?? null;
}

export function readSessionLog() {
  const relativePath = ".continuity/session-log.jsonl";

  if (!existsSync(resolveRepoPath(relativePath))) {
    return [];
  }

  return readTextFile(relativePath)
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function lastSessionReport() {
  const entries = readSessionLog().filter((entry) => typeof entry.report === "string" && entry.report.length > 0);
  return entries.at(-1)?.report ?? latestOperationalReport();
}

function formatBulletList(items) {
  if (!items || items.length === 0) {
    return "- Nenhum item registrado.";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function renderHandoff(state) {
  const latestReport = state.last_report ?? lastSessionReport() ?? "docs/operational-reports/TEMPLATE.md";
  const sessionStatus = state.session_status ?? "partial";
  const updatedBy = `${state.last_tool ?? "UNKNOWN"} @ ${state.last_machine ?? "UNKNOWN"}`;

  return `# HANDOFF — ${state.project ?? "PROJECT"}

> Fonte oficial de verdade: \`${state.source_of_truth}\`

## Última atualização
- Data/hora: ${state.last_update_utc}
- Atualizado por: ${updatedBy}
- Branch de referência: \`${state.active_branch}\`
- Commit de base oficial: \`${state.last_integrated_main_sha}\`
- Head da sessão: \`${state.last_session_head_sha ?? "N/A"}\`
- Último relatório: \`${latestReport}\`

## Estado atual resumido
- Fase atual: ${state.current_phase}
- Bloco ativo: ${state.active_block}
- Status da sessão: \`${sessionStatus}\`
- Próxima ação recomendada: ${state.next_action}

## Itens concluídos
${formatBulletList(state.completed_items)}

## Itens pendentes
${formatBulletList(state.pending_items)}

## Bloqueios externos
${formatBulletList(state.external_blockers)}

## Notas operacionais
${formatBulletList(state.notes)}

## Regras rápidas para qualquer ferramenta
1. fazer \`git fetch origin --prune\`
2. tratar \`origin/main\` como verdade oficial
3. ler:
   - \`.continuity/current-state.json\`
   - \`docs/HANDOFF.md\`
   - \`docs/MIGRATION_STATUS.md\`
   - último relatório em \`docs/operational-reports/\`
4. trabalhar em branch de sessão, nunca direto em \`main\`
5. ao encerrar, deixar tudo commitado, pushado e documentado
`;
}

export function assertFileExists(relativePath) {
  if (!existsSync(resolveRepoPath(relativePath))) {
    throw new Error(`Arquivo obrigatório ausente: ${relativePath}`);
  }
}
