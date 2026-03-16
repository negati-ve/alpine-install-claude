#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const isAlpine = fs.existsSync("/etc/alpine-release");

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, stdio: "inherit", ...opts });
}

function log(msg) {
  console.log(`\n\x1b[36m>>> ${msg}\x1b[0m\n`);
}

function fail(msg) {
  console.error(`\n\x1b[31m[ERROR] ${msg}\x1b[0m\n`);
  process.exit(1);
}

if (!isAlpine) {
  console.warn("\x1b[33m[WARN] /etc/alpine-release not found — this tool targets Alpine Linux.\x1b[0m");
}

// 1. Install system packages
log("Installing system dependencies via apk...");
const apk = run("apk add --no-cache bash git curl libgcc libstdc++ ripgrep");
if (apk.status !== 0) {
  // try sudo
  const sudo = run("sudo apk add --no-cache bash git curl libgcc libstdc++ ripgrep");
  if (sudo.status !== 0) fail("apk install failed. Make sure you have root or sudo access.");
}

// 2. Set USE_BUILTIN_RIPGREP=0 in shell profiles so it persists
log("Configuring environment...");
const profiles = [
  path.join(os.homedir(), ".bashrc"),
  path.join(os.homedir(), ".profile"),
];
const envLine = '\nexport USE_BUILTIN_RIPGREP=0\n';
for (const p of profiles) {
  try {
    const existing = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    if (!existing.includes("USE_BUILTIN_RIPGREP")) {
      fs.appendFileSync(p, envLine);
    }
  } catch (_) {}
}
process.env.USE_BUILTIN_RIPGREP = "0";

// 3. Install Claude via native binary installer
log("Installing Claude Code...");
const install = run("curl -fsSL https://claude.ai/install.sh | bash");
if (install.status !== 0) fail("Claude Code installation failed.");

// 4. Find the claude binary
const candidatePaths = [
  path.join(os.homedir(), ".local", "bin", "claude"),
  "/usr/local/bin/claude",
  "/usr/bin/claude",
];
const claudeBin = candidatePaths.find((p) => fs.existsSync(p));

if (!claudeBin) {
  // Try adding ~/.local/bin to PATH and re-checking
  const localBin = path.join(os.homedir(), ".local", "bin");
  process.env.PATH = `${localBin}:${process.env.PATH}`;
  const check = spawnSync("which claude", { shell: true, encoding: "utf8" });
  if (check.status !== 0) {
    fail(
      "claude binary not found after installation.\n" +
      "Add ~/.local/bin to your PATH and run 'claude' manually."
    );
  }
}

// 5. Launch Claude
log("Launching Claude Code...");
const launch = spawnSync(claudeBin || "claude", process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, USE_BUILTIN_RIPGREP: "0" },
  shell: !claudeBin,
});
process.exit(launch.status ?? 0);
