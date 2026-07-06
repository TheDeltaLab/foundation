#!/bin/bash
# =============================================================================
# Rename @foundation/* → @delta-ai/*
#
# Migrates the three library packages (base, platform, eslint-config) from the
# internal @foundation scope to the public @delta-ai scope.
#
# The CLI package (apps/cli, already @delta-ai/foundation) is intentionally
# skipped — it will be removed in the future now that packages are managed
# via npm directly.
#
# Usage:
#   chmod +x scripts/rename-packages.sh
#   ./scripts/rename-packages.sh          # apply changes
#   ./scripts/rename-packages.sh --dry-run  # preview only
#
# After running, you MUST:
#   1. pnpm install          # regenerate pnpm-lock.yaml
#   2. pnpm build            # verify everything compiles
#   3. pnpm -r typecheck     # verify types
# =============================================================================

set -euo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
err()  { echo -e "${RED}[✗]${NC} $*"; }

# ---------------------------------------------------------------------------
# Collect files to transform
# ---------------------------------------------------------------------------
FILES=$(find . -type f \
    \( -name '*.ts' -o -name '*.js' -o -name '*.json' -o -name '*.md' -o -name '*.yaml' -o -name '*.yml' \) \
    ! -path '*/node_modules/*' \
    ! -path '*/dist/*' \
    ! -path '*/.git/*' \
    ! -path './pnpm-lock.yaml')

# Also include .claude/settings.local.json if it exists
if [[ -f .claude/settings.local.json ]]; then
    FILES="$FILES"$'\n'".claude/settings.local.json"
fi

# ---------------------------------------------------------------------------
# Build sed commands (macOS: sed -i ''; Linux: sed -i)
# ---------------------------------------------------------------------------
SED_FLAGS=(-i '')
if [[ "$(uname)" != "Darwin" ]]; then
    SED_FLAGS=(-i)
fi

run_sed() {
    local pattern="$1"
    local description="$2"
    log "$description"
    if [[ "$DRY_RUN" == "true" ]]; then
        # Show which files would change
        while IFS= read -r f; do
            [[ -z "$f" ]] && continue
            if grep -q "$pattern" "$f" 2>/dev/null; then
                warn "  would change: $f"
            fi
        done <<< "$FILES"
    else
        while IFS= read -r f; do
            [[ -z "$f" ]] && continue
            sed "${SED_FLAGS[@]}" "$pattern" "$f" 2>/dev/null || true
        done <<< "$FILES"
    fi
}

# ===========================================================================
# STEP 1: Exact package name replacements (most specific first)
# ===========================================================================

run_sed \
    's|@foundation/base|@delta-ai/base|g' \
    "Step 1/5: @foundation/base → @delta-ai/base"

run_sed \
    's|@foundation/platform|@delta-ai/platform|g' \
    "Step 2/5: @foundation/platform → @delta-ai/platform"

run_sed \
    's|@foundation/eslint-config|@delta-ai/eslint-config|g' \
    "Step 3/5: @foundation/eslint-config → @delta-ai/eslint-config"

# ===========================================================================
# STEP 2: Generic @foundation/* references in docs and error messages
# ===========================================================================

# Handle the eslint no-restricted-imports error message.
# These are literal strings (not globs) appearing in docs and config.
run_sed \
    's|@foundation/\*|@delta-ai/*|g' \
    "Step 4/5: Literal '@foundation/*' → '@delta-ai/*'"

run_sed \
    's|@foundation/package-name/path|@delta-ai/package-name/path|g' \
    "Step 4b: eslint error message reference"

# ===========================================================================
# STEP 3: ESLint import-x/internal-regex
#   Current:  '^(@?foundation)/'
#   Target:   '^@delta-ai/'
# ===========================================================================

run_sed \
    "s|'^(@?foundation)/'|'^@delta-ai/'|g" \
    "Step 5/5: ESLint import-x/internal-regex"

# ===========================================================================
# Summary
# ===========================================================================

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    warn "Dry run complete — no files were modified."
    echo "  Run without --dry-run to apply changes."
else
    echo ""
    log "Renames applied."
    echo ""
    warn "Next steps (MANDATORY):"
    echo "  1. pnpm install           # regenerate pnpm-lock.yaml"
    echo "  2. pnpm build              # verify everything compiles"
    echo "  3. pnpm -r typecheck       # verify types"
    echo "  4. git diff --stat         # review all changes"
    echo ""
    warn "Manually verify (the script does NOT touch these):"
    echo "  • apps/cli/ — intentionally skipped (CLI will be removed)"
    echo "  • pnpm-lock.yaml — regenerate with 'pnpm install'"
fi
