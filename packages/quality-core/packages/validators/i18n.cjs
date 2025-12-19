const fs = require('fs');
const glob = require('glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

module.exports = {
    name: 'i18n',

    async run(ctx) {
        const files = glob.sync(`${ctx.rootDir}/src/**/*.{tsx,jsx}`);
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
                        // Ignore whitespace-only or non-letter generic text
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
                            !['className', 'id', 'data-testid', 'style', 'key', 'ref', 'width', 'height', 'loading', 'lang', 'name'].includes(p.node.name.name)
                        ) {
                            // Check if it looks like a translatable string (not a URL, number, etc)
                            const val = p.node.value.value;
                            if (val && /[A-Za-zÀ-ÿ]/.test(val) && !val.startsWith('/') && !val.startsWith('http')) {
                                issues.push({
                                    file,
                                    type: 'Attribute',
                                    attr: p.node.name.name,
                                    value: val,
                                    loc: p.node.loc
                                });
                            }
                        }
                    }
                });
            } catch (e) {
                // Ignore parse errors (e.g. syntax errors in work-in-progress files)
            }
        }

        const passed = issues.length === 0;
        return {
            status: passed ? 'ok' : 'warn',
            score: passed ? 100 : 50,
            raw: { issues }
        };
    }
};
