#!/usr/bin/env node
/**
 * Generate Tests from GitHub Issue
 * Used by GitHub Actions workflow to create test files from parsed issue data
 * Usage: node generate-tests-from-issue.js <componentName> <requirementsJson> [issueNumber] [issueTitle]
 */
import { generateTestContent, validateRequirements } from '@carolinappowers/vue-tdd-automation/shared/test-generator';
import { performFullValidation } from '@carolinappowers/vue-tdd-automation/shared/test-generator/validator';
// Parse command line arguments
const [, , componentName, requirementsJson, issueNumber, issueTitle] = process.argv;
if (!componentName || !requirementsJson) {
    console.error('Usage: node generate-tests-from-issue.js <componentName> <requirementsJson> [issueNumber] [issueTitle]');
    process.exit(1);
}
try {
    // Parse requirements from JSON
    const requirements = JSON.parse(requirementsJson);
    // Validate requirements
    const validation = validateRequirements(requirements);
    if (!validation.valid) {
        console.error('❌ Invalid requirements:');
        validation.errors.forEach((error) => console.error(`  - ${error}`));
        process.exit(1);
    }
    // Generate test content
    const testContent = generateTestContent(componentName, requirements, issueNumber && issueTitle ? { issueNumber, issueTitle } : {});
    // Validate generated test content
    const contentValidation = performFullValidation(testContent, componentName);
    if (!contentValidation.valid) {
        console.error('❌ Generated test content has errors:');
        contentValidation.errors.forEach((error) => console.error(`  - ${error}`));
        process.exit(1);
    }
    if (contentValidation.warnings.length > 0) {
        console.warn('⚠️  Generated test content has warnings:');
        contentValidation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
    // Output test content to stdout for GitHub Actions to capture
    console.log('TEST_CONTENT_START');
    console.log(testContent);
    console.log('TEST_CONTENT_END');
    console.error('\n✅ Test generation successful');
    console.error(`  - Total tests: ${contentValidation.summary.totalErrors + contentValidation.summary.totalWarnings}`);
    console.error(`  - Has accessibility tests: ${contentValidation.summary.hasAccessibilityTests}`);
    console.error(`  - Follows TDD pattern: ${contentValidation.summary.followsTddPattern}`);
    process.exit(0);
}
catch (error) {
    const err = error;
    console.error('❌ Error generating tests:', err.message);
    console.error(err.stack);
    process.exit(1);
}
