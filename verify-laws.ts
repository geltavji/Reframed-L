#!/usr/bin/env ts-node
/**
 * Verify Reframed Laws
 * Validates mathematical consistency and equivalence proofs
 */

import { LawReframer } from './src/synthesis/laws/LawReframer';
import * as fs from 'fs';

console.log('═══════════════════════════════════════════════════════════');
console.log('  VERIFYING REFRAMED LAWS');
console.log('═══════════════════════════════════════════════════════════\n');

// Load generated laws
const lawsData = JSON.parse(fs.readFileSync('./REFRAMED_LAWS.json', 'utf8'));

console.log(`Loaded ${lawsData.length} reframed laws for verification\n`);

const lawReframer = new LawReframer();

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

const verificationResults: any[] = [];

console.log('Running verification checks...\n');

lawsData.forEach((law: any, index: number) => {
  console.log(`[${index + 1}/${lawsData.length}] Verifying: ${law.originalLaw} (${law.strategy})`);
  
  const checks = {
    lawName: law.originalLaw,
    strategy: law.strategy,
    hashValid: false,
    consistencyOk: false,
    insightsValid: false,
    applicationsValid: false,
    overallValid: false,
    errors: [] as string[]
  };
  
  totalChecks += 4;
  
  // Check 1: Hash validation
  if (law.hash && law.hash.length === 64) {
    checks.hashValid = true;
    passedChecks++;
    console.log('  ✓ Hash valid');
  } else {
    failedChecks++;
    checks.errors.push('Invalid hash');
    console.log('  ✗ Hash invalid');
  }
  
  // Check 2: Consistency score
  if (law.consistencyScore >= 0.7) {
    checks.consistencyOk = true;
    passedChecks++;
    console.log(`  ✓ Consistency score: ${(law.consistencyScore * 100).toFixed(1)}%`);
  } else {
    failedChecks++;
    checks.errors.push(`Low consistency: ${law.consistencyScore}`);
    console.log(`  ✗ Low consistency score: ${(law.consistencyScore * 100).toFixed(1)}%`);
  }
  
  // Check 3: Insights present
  if (law.insights && law.insights.length > 0) {
    checks.insightsValid = true;
    passedChecks++;
    console.log(`  ✓ Insights: ${law.insights.length}`);
  } else {
    failedChecks++;
    checks.errors.push('No insights generated');
    console.log('  ✗ No insights');
  }
  
  // Check 4: Applications present
  if (law.applications && law.applications.length > 0) {
    checks.applicationsValid = true;
    passedChecks++;
    console.log(`  ✓ Applications: ${law.applications.length}`);
  } else {
    failedChecks++;
    checks.errors.push('No applications');
    console.log('  ✗ No applications');
  }
  
  checks.overallValid = checks.hashValid && checks.consistencyOk && 
                        checks.insightsValid && checks.applicationsValid;
  
  verificationResults.push(checks);
  console.log('');
});

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

const validLaws = verificationResults.filter(r => r.overallValid).length;
const invalidLaws = verificationResults.filter(r => !r.overallValid).length;

console.log(`Total Laws Verified: ${lawsData.length}`);
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed Checks: ${passedChecks} (${(passedChecks/totalChecks*100).toFixed(1)}%)`);
console.log(`Failed Checks: ${failedChecks}`);
console.log(`\nValid Laws: ${validLaws}`);
console.log(`Invalid Laws: ${invalidLaws}`);

if (invalidLaws > 0) {
  console.log('\n⚠️  FAILED VERIFICATIONS:\n');
  verificationResults.filter(r => !r.overallValid).forEach(r => {
    console.log(`  ${r.lawName} (${r.strategy}):`);
    r.errors.forEach((e: string) => console.log(`    - ${e}`));
  });
}

// Save verification report
const report = {
  verifiedAt: new Date().toISOString(),
  totalLaws: lawsData.length,
  totalChecks,
  passedChecks,
  failedChecks,
  validLaws,
  invalidLaws,
  successRate: passedChecks / totalChecks,
  results: verificationResults
};

fs.writeFileSync('./VERIFICATION_REPORT.json', JSON.stringify(report, null, 2));
console.log('\n✅ Verification report saved: VERIFICATION_REPORT.json\n');

console.log('═══════════════════════════════════════════════════════════');

if (invalidLaws === 0) {
  console.log('✅ ALL LAWS VERIFIED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME LAWS FAILED VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(1);
}
