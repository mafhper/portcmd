# PortCmd - Gestor de Procesos y Panel de Calidad

> *Un gestor de procesos premium para **desarrolladores y diseñadores** que exigen excelencia.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Quality Gate](https://img.shields.io/badge/Quality-Passing-success)](https://github.com/mafhper/port-command)
[![PortCmd](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com/mafhper/port-command)

**Leer en otros idiomas: [English](README.md) | [Português (Brasil)](README.pt-BR.md)**

---

**PortCmd** es más que un simple gestor de procesos. Es una herramienta integral de entorno de desarrollo diseñada para orquestar tu flujo de trabajo local, monitorear la salud de la aplicación y hacer cumplir los estándares de calidad del código a través de su **Quality Core** integrado.

---

## ✨ Características Principales

### 🚀 **Orquestación de Procesos**

- **Terminar y Reiniciar**: Termina o reinicia procesos bloqueados en puertos específicos (3000, 5173, 8080...) con un solo clic.
- **Detección Inteligente**: Identificación automática de procesos "Zombie", "Suspendidos" o con alto consumo de memoria.
- **Contexto del Proyecto**: Agrupa procesos por proyecto (ej: API + Cliente + Base de Datos) para una gestión más fácil.

### 🎨 **UI/UX Premium (Para Diseñadores)**

- **Diseño Glassmorphism**: Interfaz moderna con efectos de desenfoque, gradientes y transparencia configurables.
- **Motor de Temas**:
  - **Modos**: Claro, Oscuro, Automático.
  - **Presets**: Boreal (Aurora), Chroma (Cyberpunk), Obsidian (Minimalista), Quartz (Limpio).
- **Accesibilidad**: Modos dedicados para Deuteranopía, Protanopía y Tritanopía.
- **Píxel Perfecto**: Creado para pantallas de alta resolución con enfoque en la fidelidad visual.

### 🌐 **Internacionalización (i18n)**

- Soporte nativo para **Inglés (US)**, **Portugués (BR)** y **Español**.
- Detección automática basada en el sistema.

### 📊 **Quality Core**

Un motor centralizado para la excelencia técnica. Ver sección dedicada a continuación.

---

## 💎 Quality Core: En Busca de la Excelencia

El **Quality Core** (`@port/quality-core`) es un subsistema modular integrado en PortCmd diseñado para actuar como el "Guardián de la Calidad" para tus proyectos. No es solo un ejecutor; es una filosofía de **Mejora Continua**.

### **Cómo Funciona**

1.  **Validadores**: Scripts modulares que verifican atributos de calidad específicos:
    -   `lint`: Análisis estático de código (ESLint/TSC).
    -   `test:structure`: Verifica la integridad arquitectónica (estructura de carpetas, convenciones de nomenclatura).
    -   `test:i18n`: Asegura que todas las cadenas de texto estén envueltas en funciones de traducción.
    -   `perf:lighthouse`: Auditorías automáticas de Lighthouse (Móvil/Escritorio) para Rendimiento, SEO y Accesibilidad.
2.  **Agregación**: Todos los resultados se compilan en un Informe JSON canónico (`quality-report.json`).
3.  **Visualización**: El **Panel de Calidad** consume estos informes para mostrar Gráficos de Tendencia, Tasas de Aprobación y conocimientos detallados.

### **Uso**

- **Ejecutar Gate Completo**: `npm run quality:gate` (Ejecuta todos los validadores + Motor Lógico)
- **Solo Rendimiento**: `npm run perf:lighthouse` (Activa auditorías de Lighthouse)
- **Ver Panel**: Abre la pestaña "Quality Scans" o "Dashboard" en PortCmd.

> *"La calidad no es un acto, es un hábito."* — Aristóteles. El Quality Core automatiza este hábito.

---

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- NPM 9+ (Soporte para Workspaces)

### Configuración

```bash
# 1. Clonar
git clone https://github.com/mafhper/port-command.git
cd port-command

# 2. Instalar (Instala raíz + workspaces)
npm install

# 3. Modo Desarrollo (Ejecuta API, App y Website)
npm run dev
```

### Construcción y Despliegue

```bash
# Construir todos los componentes (App + Website)
npm run build

# Desplegar (si está configurado)
npm run deploy
```

---

## 📂 Estructura del Proyecto

| Directorio | Descripción |
|-----------|-------------|
| `/app` | La Aplicación React principal (UI del Panel). |
| `/server` | API backend Express/Node.js (Manejo de procesos, Sistema de Archivos). |
| `/packages/quality-core` | **El Cerebro**. Contiene CLI, Validadores y Motores Lógicos. |
| `/website` | Página de Aterrizaje pública y sitio de Documentación. |
| `/scripts` | Scripts de automatización para Salud, Auditoría y Operaciones. |

---

## 🤝 Contribuyendo

¡Las contribuciones son bienvenidas! Por favor, consulta `docs/CONTRIBUTING.md` (si está disponible) o sigue el proceso estándar de PR.

1. Crea una rama de funcionalidad (`feat/cosa-nueva`)
2. Haz commit de los cambios
3. Ejecuta `npm run quality:gate` para asegurar que no haya regresiones
4. Haz Push y abre un PR

---

## 📄 Licencia

MIT © mafhper
