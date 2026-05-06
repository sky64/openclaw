// Security-critical: regex patterns define which env vars are stripped from child processes.
// Allowlist overrides ensure essential system vars (PATH, HOME, etc.) are never removed.

export const SENSITIVE_ENV_PATTERNS: RegExp[] = [
  /_KEY$/i,
  /_SECRET$/i,
  /_TOKEN$/i,
  /_PASSWORD$/i,
  /_PASSWD$/i,
  /_CREDENTIAL/i,
  /_AUTH$/i,
  /_APIKEY$/i,
  /^OPENAI_/i,
  /^ANTHROPIC_/i,
  /^GOOGLE_/i,
  /^AWS_/i,
  /^AZURE_/i,
  /^GITHUB_/i,
  /^GITLAB_/i,
  /^HUGGING/i,
  /API_KEY/i,
  /SECRET_KEY/i,
  /ACCESS_KEY/i,
  /PRIVATE_KEY/i,
];

export const SAFE_ENV_ALLOWLIST: Set<string> = new Set([
  "PATH",
  "HOME",
  "USER",
  "SHELL",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TERM",
  "COLORTERM",
  "EDITOR",
  "VISUAL",
  "TMPDIR",
  "TMP",
  "TEMP",
  "XDG_RUNTIME_DIR",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  "XDG_CACHE_HOME",
  "NODE_ENV",
  "NODE_PATH",
  "NODE_OPTIONS",
  "NPM_CONFIG_PREFIX",
  "HOSTNAME",
  "PWD",
  "OLDPWD",
  "LOGNAME",
  "DISPLAY",
  "SSH_AUTH_SOCK",
  "GPG_TTY",
]);

function isSensitive(name: string): boolean {
  if (SAFE_ENV_ALLOWLIST.has(name)) {
    return false;
  }
  return SENSITIVE_ENV_PATTERNS.some((pattern) => pattern.test(name));
}

export function filterSensitiveEnv(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const filtered: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (!isSensitive(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export function countFilteredEnvVars(env: Record<string, string | undefined>): number {
  let count = 0;
  for (const key of Object.keys(env)) {
    if (isSensitive(key)) {
      count++;
    }
  }
  return count;
}
