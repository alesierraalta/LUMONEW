#!/usr/bin/env node

/**
 * Fix GitHub Workflow Configuration
 * 
 * This script helps configure the correct GitHub workflow where:
 * - dev branch is used for active development
 * - main branch is protected and only accepts PRs from dev
 * - All development work happens on dev branch
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubWorkflowFixer {
  constructor() {
    this.repoOwner = 'alesierraalta';
    this.repoName = 'LUMONEW';
  }

  /**
   * Check current branch and workflow status
   */
  checkCurrentStatus() {
    console.log('🔍 Checking current workflow status...');
    
    try {
      // Check current branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      console.log(`📍 Current branch: ${currentBranch}`);
      
      // Check if we're on the right branch
      if (currentBranch !== 'dev') {
        console.log('⚠️  You should be working on the dev branch!');
        console.log('🔄 Switching to dev branch...');
        execSync('git checkout dev');
        execSync('git pull origin dev');
        console.log('✅ Now on dev branch');
      } else {
        console.log('✅ Already on dev branch');
      }
      
      // Check branch protection status
      this.checkBranchProtection();
      
    } catch (error) {
      console.error('❌ Error checking status:', error.message);
    }
  }

  /**
   * Check branch protection configuration
   */
  checkBranchProtection() {
    console.log('\n🛡️  Checking branch protection...');
    
    try {
      // Check if GitHub CLI is available
      execSync('gh --version', { stdio: 'pipe' });
      console.log('✅ GitHub CLI is available');
      
      // Check main branch protection
      try {
        const protectionInfo = execSync(`gh api repos/${this.repoOwner}/${this.repoName}/branches/main/protection`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        console.log('✅ Main branch protection is configured');
      } catch (error) {
        console.log('⚠️  Main branch protection not configured');
        console.log('🔧 Setting up branch protection...');
        this.setupBranchProtection();
      }
      
    } catch (error) {
      console.log('❌ GitHub CLI not available or not authenticated');
      console.log('📝 Manual setup required - see instructions below');
      this.showManualSetupInstructions();
    }
  }

  /**
   * Setup branch protection rules
   */
  setupBranchProtection() {
    console.log('\n🔧 Setting up branch protection rules...');
    
    try {
      // Configure main branch protection
      const protectionConfig = {
        required_status_checks: {
          strict: true,
          contexts: [
            'prod-deploy / prod-quality',
            'prod-deploy / security',
            'prod-deploy / prod-test',
            'pr-checks / pr-validation',
            'pr-checks / pr-security'
          ]
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

      const command = `gh api repos/${this.repoOwner}/${this.repoName}/branches/main/protection --method PUT --input -`;
      execSync(command, { 
        input: JSON.stringify(protectionConfig),
        stdio: 'inherit'
      });
      
      console.log('✅ Main branch protection configured successfully');
      
      // Configure dev branch with lighter protection
      const devProtectionConfig = {
        required_status_checks: {
          strict: true,
          contexts: [
            'dev-deploy / dev-quality'
          ]
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

      const devCommand = `gh api repos/${this.repoOwner}/${this.repoName}/branches/dev/protection --method PUT --input -`;
      execSync(devCommand, { 
        input: JSON.stringify(devProtectionConfig),
        stdio: 'inherit'
      });
      
      console.log('✅ Dev branch protection configured successfully');
      
    } catch (error) {
      console.error('❌ Error setting up branch protection:', error.message);
      this.showManualSetupInstructions();
    }
  }

  /**
   * Show manual setup instructions
   */
  showManualSetupInstructions() {
    console.log('\n📋 Manual Setup Instructions');
    console.log('============================');
    console.log('');
    console.log('Since automated setup failed, please configure branch protection manually:');
    console.log('');
    console.log('1. Go to GitHub repository: https://github.com/alesierraalta/LUMONEW');
    console.log('2. Navigate to Settings → Branches');
    console.log('3. Add rule for "main" branch with these settings:');
    console.log('   ✅ Require a pull request before merging');
    console.log('   ✅ Require approvals (minimum: 1)');
    console.log('   ✅ Dismiss stale PR approvals when new commits are pushed');
    console.log('   ✅ Require review from code owners');
    console.log('   ✅ Require status checks to pass before merging');
    console.log('   ✅ Require branches to be up to date before merging');
    console.log('   ✅ Require linear history');
    console.log('   ❌ Allow force pushes');
    console.log('   ❌ Allow deletions');
    console.log('');
    console.log('4. Add rule for "dev" branch with lighter settings:');
    console.log('   ❌ Require a pull request before merging');
    console.log('   ✅ Require status checks to pass before merging');
    console.log('   ✅ Allow force pushes');
    console.log('   ❌ Allow deletions');
  }

  /**
   * Show correct workflow
   */
  showCorrectWorkflow() {
    console.log('\n🔄 Correct GitHub Workflow');
    console.log('==========================');
    console.log('');
    console.log('📝 Daily Development Process:');
    console.log('');
    console.log('1. Start your day:');
    console.log('   git checkout dev');
    console.log('   git pull origin dev');
    console.log('');
    console.log('2. Create feature branch (from dev):');
    console.log('   git checkout -b feature/your-feature-name');
    console.log('');
    console.log('3. Make your changes and commit:');
    console.log('   git add .');
    console.log('   git commit -m "feat: your changes"');
    console.log('');
    console.log('4. Push feature branch:');
    console.log('   git push origin feature/your-feature-name');
    console.log('');
    console.log('5. Create PR to dev branch (not main!):');
    console.log('   - Go to GitHub');
    console.log('   - Create Pull Request: feature/your-feature-name → dev');
    console.log('');
    console.log('6. After PR is merged to dev, create PR to main:');
    console.log('   - Create Pull Request: dev → main');
    console.log('   - This will trigger production deployment');
    console.log('');
    console.log('🚫 NEVER work directly on main branch!');
    console.log('✅ ALWAYS work on dev branch or feature branches from dev');
  }

  /**
   * Fix current workflow issues
   */
  fixWorkflow() {
    console.log('🔧 Fixing GitHub Workflow Configuration');
    console.log('========================================');
    
    // Check current status
    this.checkCurrentStatus();
    
    // Show correct workflow
    this.showCorrectWorkflow();
    
    console.log('\n✅ Workflow configuration complete!');
    console.log('🎯 Remember: Always work on dev branch, never directly on main!');
  }

  /**
   * Create a sample development session
   */
  demonstrateCorrectWorkflow() {
    console.log('\n🎯 Demonstrating Correct Workflow');
    console.log('==================================');
    
    try {
      // Ensure we're on dev
      execSync('git checkout dev');
      console.log('✅ Switched to dev branch');
      
      // Create a sample feature branch
      const featureName = 'sample-workflow-demo';
      execSync(`git checkout -b feature/${featureName}`);
      console.log(`✅ Created feature branch: feature/${featureName}`);
      
      // Create a sample file
      const sampleFile = 'WORKFLOW_DEMO.md';
      const content = `# Workflow Demo
This is a sample file created to demonstrate the correct workflow.

## Workflow Steps:
1. Create feature branch from dev
2. Make changes
3. Commit changes
4. Push feature branch
5. Create PR to dev
6. After merge, create PR from dev to main

Generated on: ${new Date().toISOString()}
`;
      
      fs.writeFileSync(sampleFile, content);
      console.log(`✅ Created sample file: ${sampleFile}`);
      
      // Commit the changes
      execSync('git add .');
      execSync('git commit -m "feat: add workflow demonstration"');
      console.log('✅ Committed changes');
      
      // Push the feature branch
      execSync(`git push origin feature/${featureName}`);
      console.log('✅ Pushed feature branch');
      
      // Switch back to dev
      execSync('git checkout dev');
      console.log('✅ Switched back to dev branch');
      
      // Clean up demo branch
      execSync(`git branch -D feature/${featureName}`);
      execSync(`git push origin --delete feature/${featureName}`);
      fs.unlinkSync(sampleFile);
      console.log('✅ Cleaned up demo branch and files');
      
      console.log('\n🎉 Workflow demonstration complete!');
      console.log('📝 Next time you develop:');
      console.log('   1. Work on dev branch or create feature branches from dev');
      console.log('   2. Create PRs to dev first');
      console.log('   3. Then create PRs from dev to main for production');
      
    } catch (error) {
      console.error('❌ Error in demonstration:', error.message);
    }
  }
}

// Run the fixer if this script is executed directly
if (require.main === module) {
  const fixer = new GitHubWorkflowFixer();
  
  const args = process.argv.slice(2);
  if (args.includes('--demo')) {
    fixer.demonstrateCorrectWorkflow();
  } else {
    fixer.fixWorkflow();
  }
}

module.exports = GitHubWorkflowFixer;