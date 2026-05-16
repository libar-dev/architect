#!/usr/bin/env bash
#
# session-stats — Quick stats for AI coding sessions across repos
#
# Usage:
#   ./scripts/session-stats.sh              # last 48 hours (default)
#   ./scripts/session-stats.sh 24h          # last 24 hours
#   ./scripts/session-stats.sh 7d           # last 7 days
#   ./scripts/session-stats.sh 2026-02-13   # since specific date
#
# Repos are configured below. Add/remove as needed.

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────
REPOS=(
  "$HOME/dev-projects/delivery-process"
  "$HOME/dev-projects/new-convex-es"
)

# ─── Parse input ────────────────────────────────────────────────────
INPUT="${1:-48h}"

# Convert relative duration to ISO date
if [[ "$INPUT" =~ ^[0-9]+(h|d|w)$ ]]; then
  NUM="${INPUT%[hdw]}"
  UNIT="${INPUT: -1}"
  case "$UNIT" in
    h) SINCE_DATE=$(date -v-"${NUM}H" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -d "${NUM} hours ago" '+%Y-%m-%dT%H:%M:%S') ;;
    d) SINCE_DATE=$(date -v-"${NUM}d" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -d "${NUM} days ago" '+%Y-%m-%dT%H:%M:%S') ;;
    w) SINCE_DATE=$(date -v-"${NUM}w" '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -d "${NUM} weeks ago" '+%Y-%m-%dT%H:%M:%S') ;;
  esac
else
  SINCE_DATE="$INPUT"
fi

# ─── Formatting helpers ─────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
CYAN='\033[36m'
YELLOW='\033[33m'
RESET='\033[0m'

fmt_num() {
  printf "%'d" "$1" 2>/dev/null || printf "%d" "$1"
}

# ─── Collect stats per repo ─────────────────────────────────────────
TOTAL_COMMITS=0
TOTAL_INS=0
TOTAL_DEL=0
TOTAL_FILES=0
TOTAL_TS=0
TOTAL_FEATURE=0
TOTAL_MD=0

echo ""
echo -e "${BOLD}Session Stats${RESET} ${DIM}(since $SINCE_DATE)${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for REPO in "${REPOS[@]}"; do
  [ -d "$REPO/.git" ] || continue
  NAME=$(basename "$REPO")

  COMMITS=$(git -C "$REPO" log --since="$SINCE_DATE" --oneline 2>/dev/null | wc -l | tr -d ' ')
  [ "$COMMITS" -eq 0 ] && continue

  # Aggregate insertions/deletions/files
  read -r FILES INS DEL <<< $(git -C "$REPO" log --since="$SINCE_DATE" --shortstat --format="" 2>/dev/null | \
    awk '{files+=$1; ins+=$4; del+=$6} END {printf "%d %d %d", files, ins, del}')

  NET=$((INS - DEL))

  # File type breakdown from diffstat
  FIRST_COMMIT=$(git -C "$REPO" log --since="$SINCE_DATE" --format="%H" 2>/dev/null | tail -1)
  if [ -n "$FIRST_COMMIT" ]; then
    FILE_TYPES=$(git -C "$REPO" diff --numstat "${FIRST_COMMIT}^..HEAD" 2>/dev/null | \
      awk -F'\t' '{print $3}' | sed 's/.*\.//' | sort | uniq -c | sort -rn)
    TS_COUNT=$(echo "$FILE_TYPES" | awk '$2 == "ts" || $2 == "tsx" {sum+=$1} END {print sum+0}')
    FEATURE_COUNT=$(echo "$FILE_TYPES" | awk '$2 == "feature" {sum+=$1} END {print sum+0}')
    MD_COUNT=$(echo "$FILE_TYPES" | awk '$2 == "md" {sum+=$1} END {print sum+0}')
  else
    TS_COUNT=0; FEATURE_COUNT=0; MD_COUNT=0
  fi

  # Top commit authors (for multi-person tracking)
  TOP_HOUR=$(git -C "$REPO" log --since="$SINCE_DATE" --format="%ai" 2>/dev/null | \
    awk '{print substr($2,1,2)}' | sort | uniq -c | sort -rn | head -1 | awk '{printf "%s:00 (%d commits)", $2, $1}')

  echo ""
  echo -e "  ${CYAN}${BOLD}$NAME${RESET}"
  echo -e "  ${GREEN}$(fmt_num "$COMMITS")${RESET} commits  │  ${GREEN}+$(fmt_num "$INS")${RESET}  ${DIM}-$(fmt_num "$DEL")${RESET}  │  net ${BOLD}$(fmt_num "$NET")${RESET} lines"
  echo -e "  $(fmt_num "$FILES") file changes  │  ${YELLOW}${TS_COUNT}${RESET} .ts  ${YELLOW}${FEATURE_COUNT}${RESET} .feature  ${DIM}${MD_COUNT} .md${RESET}"
  echo -e "  ${DIM}Peak hour: $TOP_HOUR${RESET}"

  TOTAL_COMMITS=$((TOTAL_COMMITS + COMMITS))
  TOTAL_INS=$((TOTAL_INS + INS))
  TOTAL_DEL=$((TOTAL_DEL + DEL))
  TOTAL_FILES=$((TOTAL_FILES + FILES))
  TOTAL_TS=$((TOTAL_TS + TS_COUNT))
  TOTAL_FEATURE=$((TOTAL_FEATURE + FEATURE_COUNT))
  TOTAL_MD=$((TOTAL_MD + MD_COUNT))
done

TOTAL_NET=$((TOTAL_INS - TOTAL_DEL))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${BOLD}TOTAL${RESET}"
echo -e "  ${GREEN}$(fmt_num "$TOTAL_COMMITS")${RESET} commits  │  ${GREEN}+$(fmt_num "$TOTAL_INS")${RESET}  ${DIM}-$(fmt_num "$TOTAL_DEL")${RESET}  │  net ${BOLD}$(fmt_num "$TOTAL_NET")${RESET} lines"
echo -e "  $(fmt_num "$TOTAL_FILES") file changes  │  ${YELLOW}${TOTAL_TS}${RESET} .ts  ${YELLOW}${TOTAL_FEATURE}${RESET} .feature  ${DIM}${TOTAL_MD} .md${RESET}"

# Velocity calculation
if [[ "$INPUT" =~ ^([0-9]+)h$ ]]; then
  HOURS="${BASH_REMATCH[1]}"
  if [ "$HOURS" -gt 0 ]; then
    RATE=$((TOTAL_NET / HOURS))
    COMMITS_PER_H=$(echo "scale=1; $TOTAL_COMMITS / $HOURS" | bc)
    echo ""
    echo -e "  ${DIM}Velocity: ~$(fmt_num "$RATE") net lines/hour  │  ~${COMMITS_PER_H} commits/hour${RESET}"
  fi
fi

echo ""
