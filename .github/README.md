# 🚀 GitHub Actions CI/CD Setup

This repository uses a comprehensive CI/CD pipeline built with GitHub Actions to ensure code quality, security, and reliable deployments.

## 📋 Workflows Overview

### 🔍 Main CI/CD Pipeline (`ci.yml`)

Our main pipeline includes the following stages:

#### 1. **Code Quality Checks**
- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Prettier formatting check
- ✅ Unused dependencies detection

#### 2. **Security Scanning**
- 🛡️ NPM security audit
- 🔍 Snyk vulnerability scanning
- 📊 Dependency vulnerability reports

#### 3. **Testing**
- 🧪 Unit tests with Vitest (Node 18 & 20)
- 📊 Test coverage reporting
- 🎭 End-to-end tests with Playwright
- 📈 Coverage upload to Codecov

#### 4. **Build & Deploy**
- 🏗️ Next.js application build
- 🚀 Automatic deployment to Vercel (main branch)
- 💬 Deployment URL comments on PRs

#### 5. **Performance Monitoring**
- 🔍 Lighthouse CI performance audits
- 📊 Core Web Vitals monitoring
- 🎯 Performance budget enforcement

### 📦 Dependency Management (`dependency-update.yml`)

- 🔄 Weekly dependency update reports
- 📝 Automated issue creation for outdated packages
- 🤖 Dependabot integration for automated PRs

## 🔧 Required Secrets

To enable all features, configure these secrets in your repository settings:

### Deployment Secrets
```
VERCEL_TOKEN          # Vercel deployment token
VERCEL_ORG_ID         # Vercel organization ID
VERCEL_PROJECT_ID     # Vercel project ID
```

### Security & Monitoring
```
SNYK_TOKEN           # Snyk security scanning token
CODECOV_TOKEN        # Codecov coverage reporting token
```

### GitHub Integration
```
GITHUB_TOKEN         # Automatically provided by GitHub
```

## 📊 Quality Gates

The pipeline enforces the following quality standards:

### 🎯 Performance Thresholds (Lighthouse)
- **Performance**: ≥ 80/100 (warning)
- **Accessibility**: ≥ 90/100 (required)
- **Best Practices**: ≥ 80/100 (warning)
- **SEO**: ≥ 80/100 (warning)

### 🧪 Testing Requirements
- Unit tests must pass on Node.js 18 & 20
- E2E tests must pass before deployment
- Test coverage reports are generated and uploaded

### 🔒 Security Standards
- No high-severity vulnerabilities allowed
- Regular dependency audits
- Automated security scanning with Snyk

## 🚀 Deployment Strategy

### Branches
- **`main`**: Production deployments (automatic)
- **`develop`**: Development/staging environment
- **Feature branches**: Preview deployments via PRs

### Deployment Flow
1. Code pushed to `main` branch
2. All quality checks must pass
3. Application builds successfully
4. E2E tests pass
5. Automatic deployment to production
6. Performance audit runs post-deployment

## 🛠️ Local Development Scripts

Use these scripts for local development that match the CI pipeline:

```bash
# Code Quality
npm run type-check      # TypeScript type checking
npm run lint           # ESLint linting
npm run lint:fix       # Fix ESLint issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting

# Testing
npm run test           # Run unit tests
npm run test:coverage  # Run tests with coverage
npm run test:e2e       # Run E2E tests
npm run test:e2e:ui    # Run E2E tests with UI

# Security
npm run audit          # Check for vulnerabilities
npm run audit:fix      # Fix vulnerabilities
```

## 🔄 Dependabot Configuration

Automated dependency updates are configured for:

- **NPM packages**: Weekly updates on Mondays
- **GitHub Actions**: Weekly updates on Mondays
- **Major version exclusions**: React, Next.js (manual review required)

## 📈 Monitoring & Reporting

### Automated Reports
- 📊 Weekly dependency update reports
- 🎯 Performance monitoring with Lighthouse
- 📈 Test coverage tracking
- 🛡️ Security vulnerability alerts

### Integration Points
- **Codecov**: Test coverage visualization
- **Vercel**: Deployment previews and production hosting
- **Snyk**: Security vulnerability monitoring
- **Lighthouse CI**: Performance monitoring

## 🎯 Best Practices

1. **Pull Request Workflow**
   - All checks must pass before merging
   - Deployment previews are automatically created
   - Performance audits run on every PR

2. **Security First**
   - Regular dependency updates
   - Automated vulnerability scanning
   - Security audit enforcement

3. **Performance Monitoring**
   - Lighthouse audits on every deployment
   - Performance budget enforcement
   - Core Web Vitals tracking

4. **Quality Assurance**
   - Type checking with TypeScript
   - Code formatting with Prettier
   - Comprehensive test coverage

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
- Check TypeScript errors: `npm run type-check`
- Verify linting: `npm run lint`
- Test locally: `npm run build`

**Test Failures**
- Run tests locally: `npm run test`
- Check E2E tests: `npm run test:e2e`
- Review test coverage: `npm run test:coverage`

**Deployment Issues**
- Verify Vercel secrets are configured
- Check build logs in GitHub Actions
- Ensure all quality gates pass

### Getting Help

1. Check the Actions tab for detailed logs
2. Review the specific job that failed
3. Run the same commands locally to reproduce
4. Check this README for configuration details

---

**📝 Note**: This CI/CD pipeline is designed to maintain high code quality, security, and performance standards. All checks must pass before code can be merged to the main branch. 