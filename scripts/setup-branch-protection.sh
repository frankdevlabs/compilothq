#!/bin/bash
#
# Branch Protection Setup Script
#
# This script configures branch protection rules for the main branch using the GitHub CLI.
# It requires all four CI checks to pass before allowing merges.
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Repository admin access
#
# Usage:
#   ./scripts/setup-branch-protection.sh
#
# The script will:
# 1. Configure branch protection for the 'main' branch
# 2. Require status checks: Lint, Unit Tests, Build, E2E Tests
# 3. NOT require pull request reviews
# 4. NOT allow bypass of required checks
#

set -e

# Configuration
REPO_OWNER="compilothq"  # Update with your GitHub organization/username
REPO_NAME="compilothq"   # Update with your repository name
BRANCH="main"

# Required status checks - these must match the job names in .github/workflows/ci.yml
REQUIRED_CHECKS=(
  "Lint"
  "Unit Tests"
  "Build"
  "E2E Tests"
)

echo "Setting up branch protection for ${REPO_OWNER}/${REPO_NAME}:${BRANCH}..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "Error: GitHub CLI (gh) is not installed."
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
  echo "Error: Not authenticated with GitHub CLI."
  echo "Run: gh auth login"
  exit 1
fi

# Build the JSON payload for branch protection
# Convert required checks array to JSON format
CHECKS_JSON=$(printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R . | jq -s 'map({context: .})')

# Create the full payload
PAYLOAD=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": ${CHECKS_JSON}
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF
)

echo "Branch protection configuration:"
echo "${PAYLOAD}" | jq .
echo ""

# Apply branch protection using GitHub API
echo "Applying branch protection rules..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}/protection" \
  --input - <<< "${PAYLOAD}"

echo ""
echo "✓ Branch protection configured successfully!"
echo ""
echo "Required checks:"
for check in "${REQUIRED_CHECKS[@]}"; do
  echo "  - ${check}"
done
echo ""
echo "Settings:"
echo "  - Require branches to be up to date: Yes"
echo "  - Require pull request reviews: No"
echo "  - Enforce for administrators: No"
echo "  - Allow force pushes: No"
echo "  - Allow deletions: No"
echo ""
echo "View settings at: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches"
