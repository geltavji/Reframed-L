#!/usr/bin/env ts-node
/**
 * Simple Reframed Laws Generator
 */

import { LawReframer } from './src/synthesis/laws/LawReframer';
import * as fs from 'fs';

console.log('═══════════════════════════════════════════════════════════');
console.log('  QLAWS HAM - Reframed Physics Laws Generator');
console.log('═══════════════════════════════════════════════════════════\n');

const lawReframer = new LawReframer();

// Get all original laws
const originalLawNames = [
  "Newton's Second Law",
  "Mass-Energy Equivalence",
  "Schrödinger Equation",
  "Second Law of Thermodynamics",
  "Maxwell's Equations",
  "Heisenberg Uncertainty Principle"
];

const strategies = [
  'information',
  'computational',
  'geometric',
  'holographic',
  'emergent'
];

const results: any[] = [];

console.log('Generating reframed laws...\n');

let successCount = 0;
let totalAttempts = 0;

for (const lawName of originalLawNames) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`ORIGINAL LAW: ${lawName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  for (const strategy of strategies) {
    totalAttempts++;
    const reframed = lawReframer.reframe(lawName, strategy);
    
    if (reframed) {
      successCount++;
      console.log(`✅ Strategy: ${strategy}`);
      console.log(`   Reframed Expression: ${reframed.reframedExpression}`);
      console.log(`   Statement: ${reframed.reframedStatement.substring(0, 100)}...`);
      console.log(`   Consistency Score: ${(reframed.consistencyScore * 100).toFixed(1)}%`);
      console.log(`   New Insights: ${reframed.newInsights.length}`);
      console.log(`   Applications: ${reframed.applications.length}`);
      
      results.push({
        originalLaw: lawName,
        category: reframed.originalLaw.category,
        strategy,
        originalForm: reframed.originalLaw.mathematicalForm,
        reframedExpression: reframed.reframedExpression,
        reframedStatement: reframed.reframedStatement,
        insights: reframed.newInsights,
        applications: reframed.applications,
        consistencyScore: reframed.consistencyScore,
        hash: reframed.hash
      });
    } else {
      console.log(`❌ Strategy: ${strategy} - Failed`);
    }
  }
}

console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Total Attempts: ${totalAttempts}`);
console.log(`Successful Reframings: ${successCount}`);
console.log(`Success Rate: ${(successCount / totalAttempts * 100).toFixed(1)}%\n`);

// Save results
const reportPath = './REFRAMED_LAWS.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`✅ Full report saved: ${reportPath}\n`);

// Create markdown summary
let markdown = `# Reframed Physics Laws\n`;
markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- **Total Reframings**: ${successCount}\n`;
markdown += `- **Original Laws**: ${originalLawNames.length}\n`;
markdown += `- **Strategies Applied**: ${strategies.length}\n`;
markdown += `- **Success Rate**: ${(successCount / totalAttempts * 100).toFixed(1)}%\n\n`;
markdown += `---\n\n`;

// Group by original law
const lawGroups = new Map<string, any[]>();
results.forEach(r => {
  if (!lawGroups.has(r.originalLaw)) {
    lawGroups.set(r.originalLaw, []);
  }
  lawGroups.get(r.originalLaw)!.push(r);
});

lawGroups.forEach((reframings, lawName) => {
  markdown += `## ${lawName}\n\n`;
  markdown += `**Category**: ${reframings[0].category}\n\n`;
  markdown += `**Original Form**: \`${reframings[0].originalForm}\`\n\n`;
  
  reframings.forEach((r, idx) => {
    markdown += `### ${idx + 1}. ${r.strategy.charAt(0).toUpperCase() + r.strategy.slice(1)} Reframing\n\n`;
    markdown += `**Reframed Expression**:\n\`\`\`\n${r.reframedExpression}\n\`\`\`\n\n`;
    markdown += `**Statement**: ${r.reframedStatement}\n\n`;
    markdown += `**Consistency Score**: ${(r.consistencyScore * 100).toFixed(1)}%\n\n`;
    markdown += `**New Insights**:\n`;
    r.insights.forEach((insight: string) => {
      markdown += `- ${insight}\n`;
    });
    markdown += `\n**Applications**:\n`;
    r.applications.forEach((app: string) => {
      markdown += `- ${app}\n`;
    });
    markdown += `\n**Hash**: \`${r.hash.substring(0, 32)}...\`\n\n`;
    markdown += `---\n\n`;
  });
});

const mdPath = './REFRAMED_LAWS.md';
fs.writeFileSync(mdPath, markdown);
console.log(`✅ Markdown summary saved: ${mdPath}\n`);

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ GENERATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════\n');
