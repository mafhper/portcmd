# Plano de Melhoria - Quality Core Dashboard

**Data:** 21/12/2025  
**Status:** Em Progresso

---

## Problemas Identificados

### 1. ✅ Headers Inconsistentes
**Problema:** Botões com estilos e tamanhos diferentes em cada página  
**Solução:** Criado `headerBtn()` helper com cores por propósito  
**Status:** CONCLUÍDO

### 2. ✅ Falta de Internacionalização em Botões
**Problema:** Strings hardcoded como "Run Gate", "AI Analysis", "Ping Now"  
**Solução:** Adicionadas traduções `runGate`, `runAll`, `pingNow`, `aiAnalysis`  
**Status:** CONCLUÍDO

### 3. ✅ "What's this?" não traduzido/funcional
**Problema:** Link não tinha função e estava em inglês  
**Solução:** Adicionada função `showHealthGateHelp()` com modal explicativo e tradução  
**Status:** CONCLUÍDO

### 4. ✅ Cards de Score não clicáveis
**Problema:** Usuário não conseguia navegar para relatórios detalhados  
**Solução:** Adicionado `onclick="switchTab('reports')"` nos cards  
**Status:** CONCLUÍDO

### 5. ✅ Favicon desatualizado
**Problema:** Favicon não correspondia ao logo do dashboard  
**Solução:** Criado novo favicon SVG com coração verde  
**Status:** CONCLUÍDO

### 6. ✅ Layout quebrado nos Score Cards
**Problema:** Tag HTML mal fechada causava layout vertical  
**Solução:** Corrigido `>` faltante na div do Performance card  
**Status:** CONCLUÍDO

---

## Pendências para Próxima Iteração

### 7. 🔲 Testes i18n não detectam hardcoded em templates
**Problema:** Scripts de teste não verificam strings dentro de template literals no dashboard HTML  
**Impacto:** Strings em inglês passam despercebidas  
**Ação:** Criar validador que parse o HTML e identifique textos não traduzidos

### 8. ✅ ES (Espanhol) incompleto
**Problema:** Novas traduções adicionadas apenas em EN e PT-BR  
**Solução:** Adicionadas todas as traduções ES faltantes  
**Status:** CONCLUÍDO

### 9. 🔲 Performance do LCP
**Problema:** LCP > 2.5s nas páginas (3.06s - 3.82s)  
**Impacto:** Falha no Core Web Vitals  
**Ação:**
- Otimizar imagens (WebP, lazy loading)
- Preconnect para fontes/APIs externas
- Critical CSS inline

### 10. 🔲 CLS alto (0.22 > 0.1)
**Problema:** Layout shift durante carregamento  
**Impacto:** Má experiência do usuário  
**Ação:**
- Reservar espaço para elementos dinâmicos
- Definir width/height em imagens
- Evitar inserção de conteúdo acima do viewport

### 11. 🔲 Performance Score baixo (51-67)
**Problema:** Score abaixo do target de 80  
**Impacto:** Gate falha  
**Ação:**
- Code splitting
- Tree shaking mais agressivo
- Defer scripts não críticos
- Otimizar bundle sizes

---

## Prioridade de Execução

| # | Tarefa | Impacto | Esforço | Prioridade |
|---|--------|---------|---------|------------|
| 9 | LCP Optimization | Alto | Médio | 🔴 P1 |
| 10 | CLS Fix | Alto | Baixo | 🔴 P1 |
| 11 | Performance Score | Alto | Alto | 🔴 P1 |
| 8 | ES Translations | Médio | Baixo | 🟡 P2 |
| 7 | i18n Test Coverage | Baixo | Médio | 🟢 P3 |

---

## Métricas Atuais

| Métrica | Valor | Target | Status |
|---------|-------|--------|--------|
| Quality Gate | PASS | PASS | ✅ |
| Lint | 0 errors | 0 | ✅ |
| i18n Keys | 100% match | 100% | ✅ |
| Build | OK | OK | ✅ |
| LCP | 3.06s - 3.82s | ≤ 2.5s | ❌ |
| CLS | 0.22 | ≤ 0.1 | ❌ |
| Performance | 51-67 | ≥ 80 | ❌ |
| Accessibility | 95-96 | ≥ 90 | ✅ |
| Best Practices | 100 | ≥ 90 | ✅ |
| SEO | 100 | ≥ 90 | ✅ |
