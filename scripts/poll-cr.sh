#!/bin/bash
# poll-cr.sh — Poll for CodeRabbit review response on a PR
# Usage: poll-cr.sh <repo> <pr-number> [interval_seconds]
# Example: poll-cr.sh Sandakan/Nora 499 15
#
# Run as: terminal(background=true, notify_on_complete=true)
# Loop exits when coderabbitai[bot] posts a new top-level comment OR a new review.

REPO=${1:?Usage: poll-cr.sh <repo> <pr-number> [interval]}
PR=${2:?Usage: poll-cr.sh <repo> <pr-number> [interval]}
INTERVAL=${3:-15}

# Get initial state
# Top-level issue comments only (exclude inline review comments via pull_request_review_id filter)
LAST_COMMENT_ID=$(gh api "repos/$REPO/issues/$PR/comments" --paginate \
  --jq '[.[] | select(.pull_request_review_id == null)] | .[-1].id // empty' 2>/dev/null || echo "0")
# Reviews (CR posts a review with the verdict body)
LAST_REVIEW_ID=$(gh api "repos/$REPO/pulls/$PR/reviews" --paginate \
  --jq '.[-1].id // empty' 2>/dev/null || echo "0")

echo "poll-cr: Watching $REPO#$PR for CR response (every ${INTERVAL}s)"
echo "poll-cr: Last top-level comment #$LAST_COMMENT_ID | Last review #$LAST_REVIEW_ID"

# Check if CR already replied before we started
if [ "$LAST_COMMENT_ID" != "0" ] && [ "$LAST_COMMENT_ID" != "" ]; then
  AUTHOR=$(gh api "repos/$REPO/issues/comments/$LAST_COMMENT_ID" --jq '.user.login' 2>/dev/null)
  if echo "$AUTHOR" | grep -qi "coderabbit"; then
    echo ""
    echo "=== CR COMMENT DETECTED (pre-existing) ==="
    gh api "repos/$REPO/issues/comments/$LAST_COMMENT_ID" --jq '.body' 2>/dev/null
    echo ""
    echo "=== CR REVIEW DONE ==="
    exit 0
  fi
fi

if [ "$LAST_REVIEW_ID" != "0" ] && [ "$LAST_REVIEW_ID" != "" ]; then
  AUTHOR=$(gh api "repos/$REPO/pulls/$PR/reviews" --jq '.[-1].user.login' 2>/dev/null)
  if echo "$AUTHOR" | grep -qi "coderabbit"; then
    echo ""
    echo "=== CR REVIEW DETECTED (pre-existing) ==="
    gh api "repos/$REPO/pulls/$PR/reviews" --jq '.[-1] | "State: \(.state)\nBody: \(.body)"' 2>/dev/null
    echo ""
    echo "=== CR REVIEW DONE ==="
    exit 0
  fi
fi

while true; do
  sleep "$INTERVAL"

  # Check new top-level issue comments (exclude inline review comments)
  NEW_COMMENT_ID=$(gh api "repos/$REPO/issues/$PR/comments" --paginate \
    --jq '[.[] | select(.pull_request_review_id == null)] | .[-1].id // empty' 2>/dev/null || echo "0")
  if [ "$NEW_COMMENT_ID" != "0" ] && [ "$NEW_COMMENT_ID" != "" ] && [ "$NEW_COMMENT_ID" != "$LAST_COMMENT_ID" ]; then
    AUTHOR=$(gh api "repos/$REPO/issues/comments/$NEW_COMMENT_ID" --jq '.user.login' 2>/dev/null)
    if echo "$AUTHOR" | grep -qi "coderabbit"; then
      echo ""
      echo "=== CR COMMENT DETECTED ==="
      gh api "repos/$REPO/issues/comments/$NEW_COMMENT_ID" --jq '.body' 2>/dev/null
      echo ""
      echo "=== CR REVIEW DONE ==="
      exit 0
    fi
    LAST_COMMENT_ID=$NEW_COMMENT_ID
  fi

  # Check new reviews (only counts review submissions, not inline comment additions)
  NEW_REVIEW_ID=$(gh api "repos/$REPO/pulls/$PR/reviews" --paginate \
    --jq '.[-1].id // empty' 2>/dev/null || echo "0")
  if [ "$NEW_REVIEW_ID" != "0" ] && [ "$NEW_REVIEW_ID" != "" ] && [ "$NEW_REVIEW_ID" != "$LAST_REVIEW_ID" ]; then
    AUTHOR=$(gh api "repos/$REPO/pulls/$PR/reviews" --jq '.[-1].user.login' 2>/dev/null)
    if echo "$AUTHOR" | grep -qi "coderabbit"; then
      echo ""
      echo "=== CR REVIEW DETECTED ==="
      gh api "repos/$REPO/pulls/$PR/reviews" --jq '.[-1] | "State: \(.state)\nBody: \(.body)"' 2>/dev/null
      echo ""
      echo "=== CR REVIEW DONE ==="
      exit 0
    fi
    LAST_REVIEW_ID=$NEW_REVIEW_ID
  fi

  echo -n "."
done
