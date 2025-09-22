# 🔧 GitHub Workflow Setup Guide

This guide will help you set up the GitHub workflow with separate development and production branches for the LUMO project.

## 📋 Prerequisites

Before setting up the workflow, ensure you have:

- [ ] GitHub repository with admin access
- [ ] GitHub CLI installed and authenticated
- [ ] Node.js and npm installed
- [ ] Git configured with your credentials

## 🚀 Quick Setup

### Step 1: Install GitHub CLI

**Windows (PowerShell):**
```powershell
winget install GitHub.cli
```

**macOS (Homebrew):**
```bash
brew install gh
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### Step 2: Authenticate GitHub CLI

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### Step 3: Verify Repository Access

```bash
gh repo view
```

This should display your repository information. If you get an error, ensure you have the correct permissions.

### Step 4: Create Dev Branch

```bash
# Ensure you're on the main branch
git checkout main
git pull origin main

# Create and switch to dev branch
git checkout -b dev

# Push dev branch to remote
git push origin dev
```

### Step 5: Run Setup Script

```bash
# Make the script executable (Linux/macOS)
chmod +x scripts/setup-branch-protection.js

# Run the setup script
node scripts/setup-branch-protection.js
```

### Step 6: Verify Setup

1. Go to your GitHub repository
2. Navigate to Settings → Branches
3. Verify that both `main` and `dev` branches have protection rules
4. Check that the required status checks are configured

## 🔍 Manual Setup (Alternative)

If the automated script doesn't work, you can set up branch protection manually:

### Main Branch Protection

1. Go to repository Settings → Branches
2. Click "Add rule" for the `main` branch
3. Configure the following settings:

```
Branch name pattern: main

✅ Require a pull request before merging
  ✅ Require approvals (minimum: 1)
  ✅ Dismiss stale PR approvals when new commits are pushed
  ✅ Require review from code owners

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks required:
    - prod-deploy / prod-quality
    - prod-deploy / security  
    - prod-deploy / prod-test
    - pr-checks / pr-validation
    - pr-checks / pr-security

✅ Require linear history

✅ Restrict pushes that create files
✅ Restrict pushes that create files with this pattern: main

❌ Allow force pushes
❌ Allow deletions
```

### Dev Branch Protection

1. Add another rule for the `dev` branch
2. Configure with lighter restrictions:

```
Branch name pattern: dev

❌ Require a pull request before merging

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Status checks required:
    - dev-deploy / dev-quality

✅ Allow force pushes
❌ Allow deletions
```

## 🧪 Testing the Workflow

### Test 1: Development Workflow

```bash
# Make a change in dev branch
git checkout dev
echo "# Test change" >> TEST_CHANGE.md
git add TEST_CHANGE.md
git commit -m "test: add test change for workflow verification"
git push origin dev
```

Verify:
- [ ] GitHub Actions run for dev branch
- [ ] Development deployment succeeds
- [ ] E2E tests run against dev environment

### Test 2: Production Workflow

```bash
# Create PR from dev to main
gh pr create --base main --head dev --title "Test: Workflow Verification" --body "Testing the dev to main workflow"
```

Verify:
- [ ] PR is created successfully
- [ ] All required status checks are pending
- [ ] PR cannot be merged without approvals
- [ ] Preview deployment is created

### Test 3: Branch Protection

Try to push directly to main:

```bash
git checkout main
echo "# Direct push test" >> DIRECT_PUSH_TEST.md
git add DIRECT_PUSH_TEST.md
git commit -m "test: attempt direct push to main"
git push origin main
```

This should fail with a branch protection error.

## 🔧 Configuration Files

The workflow setup creates the following files:

### GitHub Actions Workflows

- `.github/workflows/ci.yml` - Updated main CI/CD pipeline
- `.github/workflows/dev-deploy.yml` - Development deployment workflow
- `.github/workflows/prod-deploy.yml` - Production deployment workflow
- `.github/workflows/pr-checks.yml` - Pull request validation workflow

### Documentation

- `docs/GITHUB_WORKFLOW.md` - Complete workflow documentation
- `docs/SETUP_GITHUB_WORKFLOW.md` - This setup guide

### Scripts

- `scripts/setup-branch-protection.js` - Automated setup script

## 🚨 Troubleshooting

### Common Issues

**1. GitHub CLI Authentication Failed**
```bash
gh auth login --web
```

**2. Branch Protection Setup Failed**
- Ensure you have admin access to the repository
- Check that the branch exists remotely
- Verify GitHub CLI permissions

**3. Status Checks Not Found**
- Wait for the first workflow run to complete
- Check that workflow files are in the correct location
- Verify branch names match exactly

**4. PR Cannot Be Merged**
- Ensure all required status checks pass
- Verify you have the required approvals
- Check that the PR is up to date with the base branch

### Getting Help

1. Check the [GitHub Workflow Documentation](GITHUB_WORKFLOW.md)
2. Review GitHub Actions logs for specific errors
3. Contact the development team for assistance

## 📊 Monitoring

After setup, monitor the workflow through:

- **GitHub Actions tab** - View workflow runs and logs
- **Pull Requests** - Monitor PR status and required checks
- **Branch Protection** - Verify protection rules are active
- **Deployments** - Check deployment status and URLs

## 🎯 Next Steps

Once the workflow is set up:

1. **Train the team** on the new workflow
2. **Update documentation** with any project-specific details
3. **Monitor the first few deployments** to ensure everything works correctly
4. **Adjust protection rules** if needed based on team feedback

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/)

---

**Last Updated:** $(date)
**Version:** 1.0
**Maintained by:** Development Team