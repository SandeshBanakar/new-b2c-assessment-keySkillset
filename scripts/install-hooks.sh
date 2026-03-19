#!/bin/bash
# keySkillset Git Hooks Installer
# Run once after cloning the repo: bash scripts/install-hooks.sh
# Safe to re-run — overwrites existing hook with the latest version.

set -e

HOOKS_SOURCE=".claude/hooks"
HOOKS_DEST=".git/hooks"

echo ""
echo "keySkillset — Installing git hooks"
echo ""

if [ ! -d ".git" ]; then
  echo "❌ Not a git repository. Run this from the project root."
  exit 1
fi

if [ ! -d "$HOOKS_SOURCE" ]; then
  echo "❌ .claude/hooks/ directory not found. Check your repo."
  exit 1
fi

# Install pre-commit hook
if [ -f "$HOOKS_SOURCE/pre-commit" ]; then
  cp "$HOOKS_SOURCE/pre-commit" "$HOOKS_DEST/pre-commit"
  chmod +x "$HOOKS_DEST/pre-commit"
  echo "✅ pre-commit hook installed → .git/hooks/pre-commit"
else
  echo "⚠️  .claude/hooks/pre-commit not found. Skipping."
fi

echo ""
echo "Done. Hooks active on next git commit."
echo ""
echo "To uninstall: rm .git/hooks/pre-commit"
echo "To skip once: git commit --no-verify (use sparingly)"
echo ""
