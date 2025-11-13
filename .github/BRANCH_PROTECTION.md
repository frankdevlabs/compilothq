# Branch Protection Configuration

This document describes how to configure branch protection rules for the CompiloHQ repository to ensure all CI checks pass before merging.

## Required Checks

The following status checks must pass before merging to the `main` branch:

1. **Lint** - ESLint validation across all packages
2. **Unit Tests** - Unit tests with database services
3. **Build** - Build all packages with type checking
4. **E2E Tests** - End-to-end tests with Playwright

## Configuration Methods

### Method 1: Automated Setup (Recommended)

Use the provided script to automatically configure branch protection:

```bash
./scripts/setup-branch-protection.sh
```

**Prerequisites:**
- GitHub CLI (`gh`) installed and authenticated
- Repository admin access
- Update `REPO_OWNER` and `REPO_NAME` in the script

### Method 2: Manual Setup via GitHub UI

1. Navigate to your repository on GitHub
2. Go to **Settings** > **Branches**
3. Click **Add branch protection rule**
4. Configure the following settings:

#### Branch Name Pattern
- Enter: `main`

#### Protect matching branches

**Status checks:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Select the following required status checks:
  - `Lint`
  - `Unit Tests`
  - `Build`
  - `E2E Tests`

**Pull request reviews:**
- ❌ Do NOT check "Require a pull request before merging"
  - This allows direct commits to main after checks pass
  - No code review required

**Other settings:**
- ❌ Do NOT check "Require conversation resolution before merging"
- ❌ Do NOT check "Require signed commits"
- ❌ Do NOT check "Require linear history"
- ❌ Do NOT check "Include administrators"
- ❌ Do NOT check "Allow force pushes"
- ❌ Do NOT check "Allow deletions"

5. Click **Create** to save the rule

### Method 3: GitOps with .github/settings.yml

If you have the [GitHub Settings App](https://github.com/apps/settings) installed:

1. The repository already has a `.github/settings.yml` file configured
2. The app will automatically apply the settings
3. Any changes to the file will be automatically synced

**Prerequisites:**
- GitHub Settings App installed on your repository
- Repository admin access

## Verification

After configuring branch protection, verify it works:

1. Create a test branch:
   ```bash
   git checkout -b test/branch-protection
   ```

2. Create an intentional lint error:
   ```bash
   echo "const x = 1" > test-error.ts
   git add test-error.ts
   git commit -m "test: intentional lint error"
   git push origin test/branch-protection
   ```

3. Create a pull request on GitHub
4. Verify that the "Lint" check fails
5. Verify that the PR cannot be merged (merge button is disabled)
6. Fix the error and verify the check passes
7. Verify that the PR can now be merged

## Troubleshooting

### Check names don't match

If the required checks don't appear in the dropdown:

1. Ensure you've pushed commits to trigger the CI workflow at least once
2. Verify the job names in `.github/workflows/ci.yml` match exactly:
   ```yaml
   jobs:
     lint:
       name: Lint  # Must match exactly
     unit-tests:
       name: Unit Tests  # Must match exactly
     build:
       name: Build  # Must match exactly
     e2e-tests:
       name: E2E Tests  # Must match exactly
   ```

### Checks are not required

If checks pass but merge is still allowed when they should fail:

1. Verify "Require status checks to pass before merging" is enabled
2. Verify all four checks are selected in the required status checks list
3. Try refreshing the GitHub page

### Cannot bypass checks as admin

If you need to bypass checks temporarily (not recommended):

1. Uncheck "Include administrators" in branch protection settings
2. Admins can then merge despite failing checks
3. Re-enable after emergency fix

## Best Practices

1. **Never disable branch protection** - It's your safety net
2. **Fix failing checks immediately** - Don't let them accumulate
3. **Use feature branches** - Never commit directly to main
4. **Keep CI fast** - Target <10 minutes for full pipeline
5. **Monitor check failures** - Set up notifications for CI failures

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CI Workflow Documentation](.github/workflows/ci.yml)
- [Troubleshooting Guide](../docs/CI_TROUBLESHOOTING.md)
