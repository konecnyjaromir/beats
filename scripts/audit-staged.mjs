import { execFileSync } from "node:child_process";

const files = execFileSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const privatePath =
  /^(?:beats-auth\.php$|beats-config\.php$|(?:dist|node_modules|\.runtime|storage|exports|update|beats-private)\/)|(?:^|\/)private\/.*\.json\.php$|\.(?:zip|log)$/i;
for (const file of files) {
  if (privatePath.test(file))
    throw Error(`Private/generated file is staged: ${file}`);
  if (!/\.(?:php|js|jsx|mjs|json|md|html|css|ps1|txt)$/.test(file)) continue;
  const content = execFileSync("git", ["show", `:${file}`], {
    encoding: "utf8",
  });
  if (/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/.test(content))
    throw Error(`A real bcrypt hash is staged in ${file}`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content))
    throw Error(`A private key is staged in ${file}`);
}
console.log(
  `Checked ${files.length} staged files: no private paths, bcrypt hashes or private keys.`,
);
