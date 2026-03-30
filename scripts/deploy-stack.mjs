import { spawnSync } from "node:child_process";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const isWindows = process.platform === "win32";
const production = args.has("--prod");
const skipChecks = args.has("--skip-check");
const skipDbPush = args.has("--skip-db-push");
const skipFunctions = args.has("--skip-functions");
const skipVercel = args.has("--skip-vercel");
const skipVercelPull = args.has("--skip-vercel-pull");

function resolveCommand(base) {
  return isWindows ? `${base}.cmd` : base;
}

function run(command, commandArgs) {
  const rendered = [command, ...commandArgs].join(" ");
  console.log(`\n> ${rendered}`);

  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!skipChecks) {
  run(resolveCommand("npm"), ["run", "check"]);
}

if (!skipDbPush) {
  run(resolveCommand("npx"), ["supabase", "db", "push", "--include-all"]);
}

if (!skipFunctions) {
  run(resolveCommand("npx"), ["supabase", "functions", "deploy", "chat"]);
  run(resolveCommand("npx"), ["supabase", "functions", "deploy", "embed-chunks"]);
  run(resolveCommand("npx"), ["supabase", "functions", "deploy", "get-usage-stats"]);
}

if (!skipVercel) {
  const vercelEnvironment = production ? "production" : "preview";

  if (!skipVercelPull) {
    run(resolveCommand("vercel"), ["pull", "--yes", "--environment", vercelEnvironment]);
  }

  run(resolveCommand("vercel"), production ? ["deploy", "--prod", "--yes"] : ["deploy", "--yes"]);
}

console.log("\nDeploy stack finalizado.");
