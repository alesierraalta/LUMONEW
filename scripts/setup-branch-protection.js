#!/usr/bin/env node

/**
 * GitHub Branch Protection Setup Script
 * 
 * This script sets up branch protection rules for the main branch
 * to enforce the dev/prod workflow strategy.
 * 
 * Requirements:
 * - GitHub CLI (gh) installed and authenticated
 * - Repository owner/admin permissions
 * 
 * Usage:
 *   node scripts/setup-branch-protection.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REPO_OWNER = process.env.GITHUB_REPOSITORY_OWNER || 'your-username';
const REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'LUMO2';

// Required status checks for main branch
const REQUIRED_STATUS_CHECKS = [
  'prod-deploy / prod-quality',
  'prod-deploy / security',
  'prod-deploy / prod-test',
  'pr-checks / pr-validation',
  'pr-checks / pr-security'
];

// Required status checks for dev branch
const DEV_REQUIRED_STATUS_CHECKS = [
  'dev-deploy / dev-quality'
];

/**
 * Check if GitHub CLI is installed and authenticated
 */
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    console.log('✅ GitHub CLI is installed');
    
    // Check authentication
    const authStatus = execSync('gh auth status', { stdio: 'pipe' }).toString();
    if (authStatus.includes('Logged in to')) {
      console.log('✅ GitHub CLI is authenticated');
      return true;
    } else {
      console.log('❌ GitHub CLI is not authenticated');
      return false;
    }
  } catch (error) {
    console.log('❌ GitHub CLI is not installed');
    console.log('Please install GitHub CLI: https://cli.github.com/');
    return false;
  }
}

/**
 * Get repository information
 */
function getRepoInfo() {
  try {
    const repoInfo = execSync('gh repo view --json owner,name', { stdio: 'pipe' }).toString();
    const repo = JSON.parse(repoInfo);
    return { owner: repo.owner.login, name: repo.name };
  } catch (error) {
    console.log('⚠️  Could not get repository info from current directory');
    console.log(`Using configured values: ${REPO_OWNER}/${REPO_NAME}`);
    return { owner: REPO_OWNER, name: REPO_NAME };
  }
}

/**
 * Check if branch exists
 */
function branchExists(owner, repo, branch) {
  try {
    execSync(`gh api repos/${owner}/${repo}/branches/${branch}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Set up branch protection for main branch
 */
function setupMainBranchProtection(owner, repo) {
  console.log('\n🛡️  Setting up branch protection for main branch...');
  
  const protectionConfig = {
    required_status_checks: {
      strict: true,
      contexts: REQUIRED_STATUS_CHECKS
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 1,
      dismiss_stale_reviews: true,
      require_code_owner_reviews: true
    },
    restrictions: {
      users: [],
      teams: []
    },
    allow_force_pushes: false,
    allow_deletions: false,
    required_conversation_resolution: true
  };

  try {
    const command = `gh api repos/${owner}/${repo}/branches/main/protection --method PUT --input -`;
    execSync(command, { 
      input: JSON.stringify(protectionConfig),
      stdio: 'pipe'
    });
    
    console.log('✅ Main branch protection configured successfully');
    console.log('   - Requires pull request reviews');
    console.log('   - Requires status checks to pass');
    console.log('   - Restricts direct pushes');
    console.log('   - Requires linear history');
    
  } catch (error) {
    console.log('❌ Failed to set up main branch protection');
    console.log('Error:', error.message);
    return false;
  }
  
  return true;
}

/**
 * Set up branch protection for dev branch
 */
function setupDevBranchProtection(owner, repo) {
  console.log('\n🛡️  Setting up branch protection for dev branch...');
  
  const protectionConfig = {
    required_status_checks: {
      strict: true,
      contexts: DEV_REQUIRED_STATUS_CHECKS
    },
    enforce_admins: false,
    required_pull_request_reviews: {
      required_approving_review_count: 0,
      dismiss_stale_reviews: false,
      require_code_owner_reviews: false
    },
    restrictions: {
      users: [],
      teams: []
    },
    allow_force_pushes: true,
    allow_deletions: false,
    required_conversation_resolution: false
  };

  try {
    const command = `gh api repos/${owner}/${repo}/branches/dev/protection --method PUT --input -`;
    execSync(command, { 
      input: JSON.stringify(protectionConfig),
      stdio: 'pipe'
    });
    
    console.log('✅ Dev branch protection configured successfully');
    console.log('   - Requires basic status checks');
    console.log('   - Allows force pushes for rebasing');
    console.log('   - No required reviews (faster iteration)');
    
  } catch (error) {
    console.log('❌ Failed to set up dev branch protection');
    console.log('Error:', error.message);
    return false;
  }
  
  return true;
}

/**
 * Create CODEOWNERS file if it doesn't exist
 */
function setupCodeOwners(owner) {
  const codeOwnersPath = path.join(process.cwd(), '.github', 'CODEOWNERS');
  
  if (fs.existsSync(codeOwnersPath)) {
    console.log('✅ CODEOWNERS file already exists');
    return;
  }
  
  console.log('\n📝 Creating CODEOWNERS file...');
  
  const codeOwnersContent = `# Global code owners
* @${owner}

# Documentation
docs/ @${owner}

# GitHub workflows
.github/ @${owner}

# Configuration files
package.json @${owner}
package-lock.json @${owner}
tsconfig.json @${owner}
tailwind.config.ts @${owner}
next.config.js @${owner}

# Database migrations
migrations/ @${owner}
database/ @${owner}

# Scripts
scripts/ @${owner}
`;

  try {
    // Ensure .github directory exists
    const githubDir = path.dirname(codeOwnersPath);
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }
    
    fs.writeFileSync(codeOwnersPath, codeOwnersContent);
    console.log('✅ CODEOWNERS file created');
    
  } catch (error) {
    console.log('❌ Failed to create CODEOWNERS file');
    console.log('Error:', error.message);
  }
}

/**
 * Display next steps
 */
function displayNextSteps() {
  console.log('\n🎉 Branch protection setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Push the dev branch to remote:');
  console.log('   git push origin dev');
  console.log('');
  console.log('2. Create your first PR from dev to main:');
  console.log('   - Go to GitHub repository');
  console.log('   - Create Pull Request from dev to main');
  console.log('   - Verify all checks pass');
  console.log('');
  console.log('3. Test the workflow:');
  console.log('   - Make changes in dev branch');
  console.log('   - Create PR to main');
  console.log('   - Verify branch protection rules work');
  console.log('');
  console.log('📖 For detailed workflow documentation, see:');
  console.log('   docs/GITHUB_WORKFLOW.md');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 GitHub Branch Protection Setup');
  console.log('==================================');
  
  // Check prerequisites
  if (!checkGitHubCLI()) {
    process.exit(1);
  }
  
  // Get repository info
  const repoInfo = getRepoInfo();
  console.log(`\n📦 Repository: ${repoInfo.owner}/${repoInfo.name}`);
  
  // Check if branches exist
  if (!branchExists(repoInfo.owner, repoInfo.name, 'main')) {
    console.log('❌ Main branch does not exist');
    process.exit(1);
  }
  
  if (!branchExists(repoInfo.owner, repoInfo.name, 'dev')) {
    console.log('⚠️  Dev branch does not exist locally');
    console.log('Please create and push the dev branch first:');
    console.log('  git checkout -b dev');
    console.log('  git push origin dev');
    process.exit(1);
  }
  
  // Set up branch protection
  const mainSuccess = setupMainBranchProtection(repoInfo.owner, repoInfo.name);
  const devSuccess = setupDevBranchProtection(repoInfo.owner, repoInfo.name);
  
  if (!mainSuccess || !devSuccess) {
    process.exit(1);
  }
  
  // Set up CODEOWNERS
  setupCodeOwners(repoInfo.owner);
  
  // Display next steps
  displayNextSteps();
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  setupMainBranchProtection,
  setupDevBranchProtection,
  setupCodeOwners
};