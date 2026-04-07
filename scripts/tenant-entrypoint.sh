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
