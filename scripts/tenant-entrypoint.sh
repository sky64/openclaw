#!/bin/sh
# Tenant entrypoint: decode base64 config env vars into /data/ on boot,
# then start OpenClaw gateway in Telegram polling mode.

set -e

DATA_DIR="${OPENCLAW_STATE_DIR:-/data}"
HOME_DIR="${HOME:-/home/node}"
CONFIG_DIR="$HOME_DIR/.openclaw"

mkdir -p "$DATA_DIR" "$CONFIG_DIR" "$DATA_DIR/skills"

# Decode config templates from env vars (set by Telsi provisioning)
if [ -n "$SOUL_MD_B64" ]; then
  echo "$SOUL_MD_B64" | base64 -d > "$DATA_DIR/SOUL.md"
  echo "[entrypoint] Wrote SOUL.md"
fi

if [ -n "$USER_MD_B64" ]; then
  echo "$USER_MD_B64" | base64 -d > "$DATA_DIR/USER.md"
  echo "[entrypoint] Wrote USER.md"
fi

if [ -n "$OPENCLAW_CONFIG_B64" ]; then
  echo "$OPENCLAW_CONFIG_B64" | base64 -d > "$CONFIG_DIR/openclaw.json"
  echo "[entrypoint] Wrote openclaw.json to $CONFIG_DIR"
fi

# Restore RCR plugin install metadata wiped by the config overwrite above.
# The plugin files live in the Docker image layer at $CONFIG_DIR/extensions/rcr/
# and are unaffected by the overwrite, but openclaw.json needs plugins.installs.rcr
# so the CLI (info, update) can locate the install path.
RCR_EXT_DIR="$CONFIG_DIR/extensions/rcr"
if [ -d "$RCR_EXT_DIR" ] && [ -f "$CONFIG_DIR/openclaw.json" ]; then
  node -e "
    const fs = require('fs');
    const cfgPath = '$CONFIG_DIR/openclaw.json';
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    cfg.plugins = cfg.plugins || {};
    cfg.plugins.installs = cfg.plugins.installs || {};
    if (!cfg.plugins.installs.rcr) {
      const pkgPath = '$RCR_EXT_DIR/package.json';
      let version;
      try { version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version; } catch {}
      cfg.plugins.installs.rcr = {
        source: 'path',
        sourcePath: '$RCR_EXT_DIR',
        installPath: '$RCR_EXT_DIR',
        installedAt: new Date().toISOString(),
        ...(version ? { version } : {}),
      };
      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      console.log('[entrypoint] Restored plugins.installs.rcr in openclaw.json');
    }
  "
fi

# Ensure RCR plugin dependencies are available in the extensions dir.
# The Dockerfile installs them into /tmp/rcr-plugin/node_modules before
# running 'openclaw plugins install', which copies the whole directory
# (including node_modules) to $RCR_EXT_DIR. This step is a safety net in
# case the copy was incomplete or the image was built without the deps.
if [ -d /tmp/rcr-plugin/node_modules ] && [ ! -d "$RCR_EXT_DIR/node_modules" ]; then
  echo "[entrypoint] Copying RCR plugin node_modules to extensions dir..."
  cp -r /tmp/rcr-plugin/node_modules "$RCR_EXT_DIR/"
  echo "[entrypoint] RCR plugin node_modules restored"
fi

if [ -n "$SKILLS_PAYLOAD_B64" ]; then
  echo "$SKILLS_PAYLOAD_B64" | base64 -d > /tmp/skills-payload.json
  node -e "
    const fs = require('fs');
    const skills = JSON.parse(fs.readFileSync('/tmp/skills-payload.json', 'utf8'));
    for (const [name, content] of Object.entries(skills)) {
      fs.writeFileSync('$DATA_DIR/skills/' + name + '.md', String(content));
    }
    console.log('[entrypoint] Wrote ' + Object.keys(skills).length + ' skills');
  "
  rm -f /tmp/skills-payload.json
fi

echo "[entrypoint] Config ready, starting OpenClaw gateway..."
exec node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan
