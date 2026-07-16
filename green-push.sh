#!/bin/zsh
# ============================================================
# green-push.sh — Commit each changed file individually
# and push to GitHub for maximum green contribution dots.
#
# Usage: ./green-push.sh [--dry-run]
# ============================================================

set -euo pipefail

REPO_DIR="/Users/pratulmakar/Developer/hmr"
BRANCH="main"
DRY_RUN=false
PUSH_BATCH_SIZE=10

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN — no commits or pushes will be made."
fi

cd "$REPO_DIR"

commit_count=0

generate_message() {
  local file="$1"
  local change_type="$2"

  local area=""
  if [[ "$file" == server/src/modules/* ]]; then
    area=$(echo "$file" | sed -E 's|server/src/modules/([^/]+)/.*|\1|')
  elif [[ "$file" == client/features/* ]]; then
    area=$(echo "$file" | sed -E 's|client/features/([^/]+)/.*|\1|')
  elif [[ "$file" == client/app/* ]]; then
    area=$(echo "$file" | sed -E 's|client/app/[^/]*/([^/]+)/.*|\1|')
  elif [[ "$file" == client/components/* ]]; then
    area=$(echo "$file" | sed -E 's|client/components/([^/]+)/.*|\1|')
  elif [[ "$file" == server/prisma/* ]]; then
    area="prisma"
  else
    area="core"
  fi

  area=$(echo "$area" | sed 's/[()]//g')
  local bname=$(basename "$file")

  case "$change_type" in
    M)   echo "refactor($area): update $bname" ;;
    A|NEW) echo "feat($area): add $bname" ;;
    D)   echo "chore($area): remove $bname" ;;
    R)   echo "refactor($area): rename $bname" ;;
    *)   echo "chore($area): update $bname" ;;
  esac
}

maybe_push() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "  ↳ [dry-run] would push to origin/$BRANCH"
    return
  fi
  echo "  ⬆️  Pushing batch to origin/$BRANCH ..."
  git push origin "$BRANCH" --quiet
}

echo ""
echo "📂 Scanning for changed files..."
echo ""

# ---- Process tracked (modified/deleted) files ----
git diff --name-status HEAD | while IFS=$'\t' read -r change_type file; do
  msg=$(generate_message "$file" "$change_type")

  if [[ "$DRY_RUN" == true ]]; then
    echo "  [dry-run] ($change_type) $msg"
  else
    if [[ "$change_type" == "D" ]]; then
      git rm --quiet "$file" 2>/dev/null || git add "$file"
    else
      git add "$file"
    fi
    git commit --quiet -m "$msg"
    commit_count=$((commit_count + 1))
    echo "  ✅ ($commit_count) $msg"

    if [[ $commit_count -ge $PUSH_BATCH_SIZE && $((commit_count % PUSH_BATCH_SIZE)) -eq 0 ]]; then
      maybe_push
    fi
  fi
done

# ---- Process untracked (new) files ----
git ls-files --others --exclude-standard | while read -r file; do
  [[ -d "$file" ]] && continue

  msg=$(generate_message "$file" "NEW")

  if [[ "$DRY_RUN" == true ]]; then
    echo "  [dry-run] (NEW) $msg"
  else
    git add "$file"
    git commit --quiet -m "$msg"
    commit_count=$((commit_count + 1))
    echo "  ✅ ($commit_count) $msg"

    if [[ $commit_count -ge $PUSH_BATCH_SIZE && $((commit_count % PUSH_BATCH_SIZE)) -eq 0 ]]; then
      maybe_push
    fi
  fi
done

# ---- Final push ----
if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo "  ⬆️  Final push to origin/$BRANCH ..."
  git push origin "$BRANCH" --quiet 2>/dev/null || true
fi

echo ""
echo "🎉 Done! All files committed individually and pushed."
echo "   Your GitHub contribution graph is about to look 🟢🟢🟢!"
echo ""
