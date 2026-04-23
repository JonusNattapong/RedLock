# Mibu 101 (v2.0.0) — AuditorAi 

## 🛰️ Autonomous Swarm Intelligence & Strategic Red-Teaming Platform

Mibu 101 is a high-fidelity autonomous intelligence platform engineered for deep-spectrum security assessments, prompt resilience mapping, and systemic vulnerability discovery. It utilizes a parallel swarm architecture with **Intelligence Enforcement Protocols** to ensure comprehensive research delivery and zero-summary laziness.

> ⚠️ **FOR EDUCATIONAL PURPOSES ONLY**
> This project is created for learning, research and cybersecurity skill training. Do not use on systems without explicit written authorization.
>
> **Operational Noir Mode: Enabled**

---

## 🎬 Operational Intelligence Stream

<div align="center">
  <video src="media/demo_auditorai_v2.mp4" width="100%" controls>
    Your browser does not support the video tag.
  </video>
</div>

---

## ✨ Elite Capabilities

- **🧬 Smart Fuzzer (Predictive Recon):** Stack-aware path prediction. Instead of brute-forcing, it detects technologies (Next.js, PHP, WordPress, etc.) and predicts hidden directories, backup files, and forgotten endpoints based on developer habits.
- **🎭 Shadow Stealth Mode (Ghost in the Shell):** Automated identity rotation. Every request features randomized high-fidelity User-Agents and tactical headers. Supports proxy rotation to bypass WAFs and IP-based bans.
- **📊 Mission Dossier 2.0:** Professional-grade PDF reports. Automatically generates premium dossiers with Risk Heatmaps, OWASP Top-10 mapping, and high-fidelity evidence logs.
- **🛰️ Dynamic Tactical HUD:** Real-time operational phase tracking (Recon, Mapping, Analysis, Exploitation) through an advanced TUI interface.
- **🛡️ Intelligence Enforcement:** Anti-laziness protocol that prevents AI from providing short summaries. Forces full evidence delivery or falls back to internal draft reconstruction.
- **🧠 Swarm Orchestration:** Parallel execution across multiple providers (OpenAI, Anthropic, Gemini, Kilocode) for cross-validation of vulnerabilities.
- **👁️ Vision-Powered Audit:** AI-powered UI vulnerability scanning to find hidden elements and UI-logic flaws invisible to traditional crawlers.

---

## 🎯 Special Features

### Mission Dossiers 2.0 (Premium Output)

AuditorAi now archives all findings into a **Premium Strategic PDF**. This isn't just a text log; it's a graded assessment featuring:
- **Risk Heatmap:** Visual impact vs. likelihood matrix.
- **OWASP Alignment:** Automated mapping to global security standards.
- **Executive Summary:** High-level briefing for decision-makers.
- **Tactical Evidence:** Technical snapshots and PoCs for devs.

### Integrated Vulnerable Lab (13-Level)

Includes a full progressive security training lab with 13 levels of real-world vulnerabilities:

| Level | Port | Flaw Category | Type of Vulnerability |
|---|---|---|---|
| Level 01 | 8101 | Auth Bypass | Loose equality comparison |
| Level 02 | 8102 | Injection | SQL Injection (Classic) |
| Level 03 | 8103 | XSS | Reflected + Stored Scripting |
| Level 04 | 8104 | IDOR | Broken object level access |
| Level 05 | 8105 | CSRF | Cross-Site Request Forgery |
| Level 06 | 8106 | Blind SQLi | Time-based inference |
| Level 07 | 8107 | WAF Bypass | XSS filter evasion |
| Level 08 | 8108 | Deserialization | Insecure Object Data handling |
| Level 09 | 8109 | SSRF | Server-Side Request Forgery |
| Level 10 | 8110 | Logic Flaw | Business logic/Payment bypass |
| Level 11 | 8111 | File Upload | Unrestricted Shell Upload |
| Level 12 | 8112 | Race Condition | Concurrency-based logic flaws |
| Level 13 | 8113 | JWT Forgery | Broken Token Authentication |

```bash
# Run full lab environment
node lab/lab_server.js
# Access: http://localhost:8100
```

---

## 🏗 Technology Stack

- **Core:** Node.js + Express 5.x
- **Agentic Engine:** Custom Swarm Orchestrator (Multi-Provider)
- **Intelligence:** GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Llama 3
- **Browsing:** Playwright (Stealth-hardened)
- **Reporting:** ReportForge (Playwright-PDF Engine)
- **Evasion:** Shadow Stealth Engine (Identity Swapper)

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/JonusNattapong/AuditorAi.git
cd Mibu-101
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and enter your API keys. Pro-tip: Add `AUDITOR_PROXIES` for Ghost Mode.

```env
# Shadow Stealth Config
AUDITOR_MIN_DELAY=300
AUDITOR_MAX_DELAY=1200
AUDITOR_PROXIES=http://user:pass@proxy1,http://proxy2
```

### 3. Execution

| Command | Description |
|---|---|
| `npm start` | Launch Strategic CLI |
| `npm run tui` | Operational Tactical HUD |
| `npm run web` | Web Deployment Dashboard |
| `npm run dev` | Dev Watch Mode |

---

## ⚖️ Ethics and Compliance

This platform is intended for authorized security auditing, educational research, and defense hardening only. Unauthorized use of this tool for malicious activity is strictly prohibited. Mibu 101 is conditioned to operate as a professional security assessment engine.

---

*Operational Precision. Swarm Intelligence. Zero Summary Laziness.*
