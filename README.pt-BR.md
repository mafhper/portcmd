# PortCmd - Gerenciador de Processos & Dashboard de Qualidade

> *Um gerenciador de processos premium para **desenvolvedores e designers** que exigem excelência.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Quality Gate](https://img.shields.io/badge/Quality-Passing-success)](https://github.com/mafhper/port-command)
[![PortCmd](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com/mafhper/port-command)

**Leia em outros idiomas: [English](README.md) | [Español](README.es.md)**

---

**PortCmd** é mais do que apenas um gerenciador de processos. É uma ferramenta abrangente de ambiente de desenvolvimento projetada para orquestrar seu fluxo de trabalho local, monitorar a saúde da aplicação e impor padrões de qualidade de código através de seu **Quality Core** integrado.

---

## ✨ Funcionalidades Principais

### 🚀 **Orquestração de Processos**

- **Encerrar e Reiniciar**: Encerre ou reinicie processos travados em portas específicas (3000, 5173, 8080...) com um clique.
- **Detecção Inteligente**: Identificação automática de processos "Zumbi", "Suspenso" ou com alto consumo de memória.
- **Contexto de Projeto**: Agrupa processos por projeto (ex: API + Cliente + Banco de Dados) para um gerenciamento mais fácil.

### 🎨 **UI/UX Premium (Para Designers)**

- **Design Glassmorphism**: Interface moderna com efeitos de desfoque, gradientes e transparência configuráveis.
- **Motor de Temas**:
  - **Modos**: Claro, Escuro, Automático.
  - **Presets**: Boreal (Aurora), Chroma (Cyberpunk), Obsidian (Minimalista), Quartz (Limpo).
- **Acessibilidade**: Modos dedicados para Deuteranopia, Protanopia e Tritanopia.
- **Pixel Perfect**: Feito para telas de alta resolução com foco em fidelidade visual.

### 🌐 **Internacionalização (i18n)**

- Suporte nativo para **Inglês (US)**, **Português (BR)** e **Espanhol**.
- Detecção automática baseada no sistema.

### 📊 **Quality Core**

Um motor centralizado para excelência técnica. Veja a seção dedicada abaixo.

---

## 💎 Quality Core: Em Busca da Excelência

O **Quality Core** (`@port/quality-core`) é um subsistema modular integrado ao PortCmd projetado para agir como o "Guardião da Qualidade" para seus projetos. Não é apenas um executor; é uma filosofia de **Melhoria Contínua**.

### **Como Funciona**

1.  **Validadores**: Scripts modulares que verificam atributos de qualidade específicos:
    - `lint`: Análise estática de código (ESLint/TSC).
    - `test:structure`: Verifica a integridade arquitetural (estrutura de pastas, convenções de nomenclatura).
    - `test:i18n`: Garante que todas as strings de texto estejam encapsuladas em funções de tradução.
    - `perf:lighthouse`: Auditorias automáticas do Lighthouse (Mobile/Desktop) para Desempenho, SEO e Acessibilidade.
2. **Agregação**: Todos os resultados são compilados em um Relatório JSON canônico (`quality-report.json`).
3. **Visualização**: O **Dashboard de Qualidade** consome esses relatórios para renderizar Gráficos de Tendência, Taxas de Aprovação e insights detalhados.

### **Uso**

- **Executar Gate Completo**: `npm run quality:gate` (Executa todos os validadores + Motor Lógico)
- **Apenas Desempenho**: `npm run perf:lighthouse` (Aciona auditorias do Lighthouse)
- **Ver Dashboard**: Abra a aba "Quality Scans" ou "Dashboard" no PortCmd.

> *"Qualidade não é um ato, é um hábito."* — Aristóteles. O Quality Core automatiza esse hábito.

---

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- NPM 9+ (Suporte a Workspaces)

### Configuração

```bash
# 1. Clonar
git clone https://github.com/mafhper/port-command.git
cd port-command

# 2. Instalar (Instala raiz + workspaces)
npm install

# 3. Modo Desenvolvimento (Roda API, App e Website)
npm run dev
```

### Build e Deploy

```bash
# Compilar todos os componentes (App + Website)
npm run build

# Deploy (se configurado)
npm run deploy
```

---

## 📂 Estrutura do Projeto

| Diretório | Descrição |
|-----------|-------------|
| `/app` | A Aplicação React principal (UI do Dashboard). |
| `/server` | API backend Express/Node.js (Manipulação de processos, Sistema de Arquivos). |
| `/packages/quality-core` | **O Cérebro**. Contém CLI, Validadores e Motores Lógicos. |
| `/website` | Landing Page pública e site de Documentação. |
| `/scripts` | Scripts de automação para Saúde, Auditoria e Operações. |

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Consulte `docs/CONTRIBUTING.md` (se disponível) ou siga o processo padrão de PR.

1. Crie uma branch de funcionalidade (`feat/coisa-nova`)
2. Faça commit das alterações
3. Execute `npm run quality:gate` para garantir que não haja regressões
4. Faça o Push e abra um PR

---

## 📄 Licença

MIT © mafhper
