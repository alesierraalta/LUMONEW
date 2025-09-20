# 🚀 GitHub Workflow - Dev/Prod Branching Strategy

This document outlines the GitHub workflow and branching strategy implemented for the LUMO project, ensuring proper separation between development and production environments.

## 🌳 Branch Structure

### Main Branches

- **`main`** - Production branch
  - Protected branch with strict rules
  - Only accepts changes via Pull Requests from `dev`
  - Requires approvals before merging
  - Automatically deploys to production when merged

- **`dev`** - Development branch
  - Active development branch
  - All feature development happens here
  - Automatically deploys to development environment
  - Source for all Pull Requests to `main`

### Feature Branches

- **`feature/*`** - Feature development branches
  - Created from `dev` branch
  - Merged back to `dev` when complete
  - Used for individual features or bug fixes

## 🔄 Development Workflow

### 1. Daily Development

```bash
# Start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push feature branch
git push origin feature/your-feature-name

# Create PR to dev branch
# Merge when ready
```

### 2. Development to Production

```bash
# After feature is merged to dev and tested
git checkout dev
git pull origin dev

# Create PR from dev to main
# Wait for approvals and CI checks
# Merge when all checks pass
```

## 🛡️ Branch Protection Rules

### Main Branch Protection

The `main` branch has the following protections:

1. **Require Pull Request Reviews**
   - Minimum 1 reviewer required
   - Dismiss stale PR approvals when new commits are pushed
   - Require review from code owners

2. **Require Status Checks**
   - All CI checks must pass before merging
   - Require branches to be up to date before merging

3. **Restrict Pushes**
   - No direct pushes allowed
   - Only administrators can push directly (emergency fixes)

4. **Require Linear History**
   - Force linear history for clean git log

### Dev Branch Protection

The `dev` branch has moderate protections:

1. **Require Status Checks**
   - Basic CI checks must pass
   - Allows faster iteration

2. **Allow Force Pushes**
   - Allows rebasing and force pushing for cleaner history

## 🤖 GitHub Actions Workflows

### 1. Development Deployment (`dev-deploy.yml`)

**Triggers:**
- Push to `dev` branch
- Pull requests to `dev` branch

**Jobs:**
- Quality checks (TypeScript, ESLint, tests)
- Development build
- Deploy to development environment
- E2E tests against dev environment

**Environments:**
- `development` - Development deployment target

### 2. Production Deployment (`prod-deploy.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
- Comprehensive quality checks
- Security scans
- Production testing (multiple Node.js versions)
- Production build
- Deploy to production
- E2E tests against production
- Lighthouse performance monitoring
- Deployment notifications

**Environments:**
- `production` - Production deployment target

### 3. Pull Request Checks (`pr-checks.yml`)

**Triggers:**
- Pull requests to `main` branch
- PR events: opened, synchronize, reopened, ready_for_review

**Jobs:**
- PR validation (quality checks, tests, build)
- Security checks
- PR preview deployment
- E2E tests against preview
- PR status summary

**Environments:**
- `pr-preview` - Preview deployment for PRs

## 🔧 Setting Up Branch Protection

### Via GitHub Web Interface

1. Go to repository Settings → Branches
2. Click "Add rule" or edit existing rule for `main`
3. Configure the following:

```
Branch name pattern: main

☑️ Require a pull request before merging
  ☑️ Require approvals (minimum: 1)
  ☑️ Dismiss stale PR approvals when new commits are pushed
  ☑️ Require review from code owners

☑️ Require status checks to pass before merging
  ☑️ Require branches to be up to date before merging
  ☑️ Status checks required:
    - prod-deploy / prod-quality
    - prod-deploy / security  
    - prod-deploy / prod-test
    - pr-checks / pr-validation
    - pr-checks / pr-security

☑️ Require linear history

☑️ Restrict pushes that create files
☑️ Restrict pushes that create files with this pattern: main

☑️ Allow force pushes
  ☐ Allow deletions
```

### Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
gh auth login

# Set up branch protection for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["prod-deploy / prod-quality","prod-deploy / security","prod-deploy / prod-test","pr-checks / pr-validation","pr-checks / pr-security"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions='{"users":[],"teams":[]}' \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## 📋 Developer Guidelines

### Before Starting Work

1. **Sync with latest changes:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/descriptive-name
   ```

### During Development

1. **Make small, focused commits:**
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

2. **Push frequently:**
   ```bash
   git push origin feature/descriptive-name
   ```

3. **Keep feature branch updated:**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout feature/descriptive-name
   git rebase dev
   ```

### Completing Features

1. **Create PR to dev:**
   - Use descriptive title and description
   - Link related issues
   - Request appropriate reviewers

2. **Address feedback:**
   - Make requested changes
   - Respond to comments
   - Update PR description if needed

3. **Merge to dev:**
   - Wait for CI checks to pass
   - Get required approvals
   - Merge using "Squash and merge"

### Promoting to Production

1. **Create PR from dev to main:**
   - Use release notes format for title
   - Include comprehensive description of changes
   - Link to all related PRs merged to dev

2. **Production deployment:**
   - All CI checks must pass
   - Security scans must pass
   - Performance tests must pass
   - Required approvals must be obtained

3. **Monitor deployment:**
   - Check deployment logs
   - Verify E2E tests pass
   - Monitor performance metrics

## 🚨 Emergency Procedures

### Hotfix Process

For critical production issues:

1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue
   ```

2. **Make minimal fix:**
   ```bash
   git add .
   git commit -m "fix: critical security issue"
   git push origin hotfix/critical-issue
   ```

3. **Create PR to main:**
   - Mark as urgent
   - Request expedited review
   - Include detailed explanation

4. **After merge to main:**
   ```bash
   git checkout dev
   git merge main
   git push origin dev
   ```

## 📊 Monitoring and Alerts

### Deployment Monitoring

- **Development deployments:** Automatic, monitored via GitHub Actions
- **Production deployments:** Monitored with Lighthouse performance checks
- **Failed deployments:** Automatic rollback and notifications

### Key Metrics

- **Build success rate:** Tracked via GitHub Actions
- **Test coverage:** Reported via Codecov integration
- **Performance scores:** Monitored via Lighthouse CI
- **Security vulnerabilities:** Scanned via Snyk integration

## 🔗 Related Documentation

- [CI/CD Pipeline Configuration](.github/workflows/)
- [Testing Strategy](TEST_COVERAGE_DOCUMENTATION.md)
- [Performance Optimization](PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Security Guidelines](AUDIT_SYSTEM_CONFIGURATION.md)

## 📞 Support

For questions about the workflow or branching strategy:

1. Check existing GitHub Issues
2. Create a new issue with label `workflow`
3. Contact the development team via Slack

---

**Last Updated:** $(date)
**Version:** 1.0
**Maintained by:** Development Team