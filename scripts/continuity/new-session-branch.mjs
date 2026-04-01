import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { hostname, parseArgs, repoRoot, todayUtc } from "./common.mjs";

function sanitizeSegment(value) {
  return value
    .trim()
    .replace(/\s+/gu, "-")
    .replace(/[^A-Za-z0-9._-]/gu, "-")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "")
    .toUpperCase();
}

const args = parseArgs(process.argv.slice(2));
const block = args.block;

if (!block) {
  throw new Error("--block é obrigatório, por exemplo: --block BLOCO-1-RLS");
}

const date = args.date ?? todayUtc();
const machine = sanitizeSegment(args.machine ?? hostname());
const tool = sanitizeSegment(args.tool ?? "CODEX");
const blockSegment = sanitizeSegment(block);
const base = args.base ?? "origin/main";
const branch = `session/${date}/${machine}/${tool}/${blockSegment}`;
const worktreePath = args.worktree;

if (!worktreePath) {
  console.log(branch);
  console.log(`git worktree add -b ${branch} <path> ${base}`);
  process.exit(0);
}

if (existsSync(worktreePath)) {
  throw new Error(`O caminho do worktree já existe: ${worktreePath}`);
}

execFileSync("git", ["fetch", "origin", "--prune"], {
  cwd: repoRoot,
  stdio: "inherit",
});

execFileSync("git", ["worktree", "add", "-b", branch, worktreePath, base], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (typeof args["lock-reason"] === "string" && args["lock-reason"].trim().length > 0) {
  execFileSync("git", ["worktree", "lock", worktreePath, "--reason", args["lock-reason"]], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

console.log(`Worktree criado: ${worktreePath}`);
console.log(`Branch criada: ${branch}`);
