const fs = require('fs');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

module.exports = {
    name: 'i18n',

    async run(ctx) {
        // Fallback if glob not available or other issue
        try {
            const files = glob.sync(`${ctx.rootDir || '.'}/src/**/*.{tsx,jsx}`);
            const issues = [];

            for (const file of files) {
                const code = fs.readFileSync(file, 'utf8');
                try {
                    const ast = parser.parse(code, {
                        sourceType: 'module',
                        plugins: ['jsx', 'typescript']
                    });

                    traverse(ast, {
                        JSXText(p) {
                            const v = p.node.value.trim();
                            // Simple heuristic: contains letters, not just symbols/numbers
                            if (v && /[A-Za-zÀ-ÿ]/.test(v)) {
                                issues.push({
                                    file,
                                    type: 'JSXText',
                                    value: v.slice(0, 80),
                                    loc: p.node.loc
                                });
                            }
                        },
                        JSXAttribute(p) {
                            if (
                                p.node.value?.type === 'StringLiteral' &&
                                !['className', 'id', 'data-testid', 'href', 'src', 'style', 'width', 'height', 'target', 'rel'].includes(p.node.name.name) &&
                                /[A-Za-zÀ-ÿ]/.test(p.node.value.value)
                            ) {
                                issues.push({
                                    file,
                                    type: 'Attribute',
                                    attr: p.node.name.name,
                                    value: p.node.value.value,
                                    loc: p.node.loc
                                });
                            }
                        }
                    });
                } catch (parseErr) {
                    console.warn(`Failed to parse ${file}: ${parseErr.message}`);
                }
            }

            return {
                status: issues.length ? 'warn' : 'ok',
                data: { issueCount: issues.length, issues: issues.slice(0, 50) }
            };
        } catch (e) {
            return { status: 'skip', error: e.message };
        }
    }
};
