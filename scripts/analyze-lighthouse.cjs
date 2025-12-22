const fs = require('fs');
const path = require('path');

const reportPath = process.argv[2];

if (!reportPath) {
    console.error('Please provide the path to the Lighthouse JSON report.');
    process.exit(1);
}

try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const categories = report.categories;
    const audits = report.audits;

    console.log(`\nAnalyzing Report: ${path.basename(reportPath)}`);
    console.log(`Target: ${report.metadata.target || 'Unknown'} | FormFactor: ${report.metadata.formFactor || 'Unknown'}`);
    console.log('--------------------------------------------------');

    const targetCategories = ['accessibility', 'best-practices', 'performance', 'seo'];

    targetCategories.forEach(categoryId => {
        const category = categories[categoryId];
        if (!category) return;

        console.log(`\n### ${category.title} (Score: ${Math.round(category.score * 100)})`);

        category.auditRefs.forEach(ref => {
            const audit = audits[ref.id];
            if (audit.score !== null && audit.score < 1 && ref.weight > 0) {
                console.log(`- [${Math.round(audit.score * 100)}] ${audit.title} (${audit.id})`);
                if (audit.displayValue) console.log(`  Value: ${audit.displayValue}`);
                // if (audit.details && audit.details.items && audit.details.items.length > 0) {
                //   console.log(`  Items: ${audit.details.items.length}`);
                // }
            }
        });
    });

} catch (error) {
    console.error('Error parsing report:', error.message);
}
