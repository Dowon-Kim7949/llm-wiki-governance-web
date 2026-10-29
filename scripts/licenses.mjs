// Lists the licence of every installed production dependency (npm ls --omit=dev).
//   node scripts/licenses.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const out = execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["ls", "--omit=dev", "--all", "--parseable"], {
  encoding: "utf8",
  shell: process.platform === "win32",
});
const counts = new Map();
const unusual = [];
for (const dir of out.split(/\r?\n/).slice(1).filter(Boolean)) {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const license = typeof pkg.license === "string" ? pkg.license : JSON.stringify(pkg.license ?? pkg.licenses ?? "UNKNOWN");
  counts.set(license, (counts.get(license) ?? 0) + 1);
  if (!/^(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD)$/.test(license)) unusual.push(`${license}  ${pkg.name}@${pkg.version}`);
}
console.log([...counts].map(([l, n]) => `${n}\t${l}`).join("\n"));
if (unusual.length) console.log(`\nNot in the permissive allow-list:\n${unusual.join("\n")}`);
