# 🚀 JustOpen Framework

**JustOpen** is a high-performance MVC framework based on the [Bun](https://bun.sh) runtime. Designed for rapid development of flexible web applications using a modern technology stack.

---

## 🛠 Tech Stack

* **Runtime:** [Bun](https://bun.sh) (v1.3.11+) — all in one: runtime, package manager, and bundler.
* **View Engine:** [Eta v4](https://eta.js.org/) — fast and lightweight JS templates.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) — a modern CSS-first engine.
* **Database:** MySQL 2 (mysql2 driver).
* **Utilities:** * Sharp — image processing.
* Day.js — working with dates.
* Concurrently — running development processes in parallel.

---

## 🚀 Quick Start

### Installing Dependencies
\`\`\`bash
bun install
\`\`\`

### Development Mode
Starts the server with hot-reload and parallel style building for the catalog and admin panel:
\`\`\`bash
bun run dev
\`\`\`

### Production Run
\`\`\`bash
bun run start
\`\`\`

---

## 📁 Project Structure

* **\`admin/\`** — Control panel logic, controllers, and themes.
* **\`catalog/\`** — Frontend: controllers, models, and storefront templates.
* **\`system/\`** — System core: Registry, database management, base classes.
* **\`storage/\`** — Cache files, logs, and temporary data.
* **\`index.ts\`** — Main entry point.

---

## 🗺 Roadmap

- [ ] **HTML Full Page Cache** — Implementation of a caching system for finished pages for extreme performance.
- [ ] **URL Class in Registry** — Implementation of centralized link management via Registry.
- [ ] **Basic Class Model** — Creation of an abstract class to unify interaction with the database.
- [ ] **Image Optimization** — Automatic WebP generation and on-the-fly resizing.

---

## 🔒 Security and Environment
For working on virtual disks (e.g., **VeraCrypt**), it is recommended to use \`bun install\` in local directories to avoid \`EINVAL\` file system errors.

---

## 📝 License
Private / MIT