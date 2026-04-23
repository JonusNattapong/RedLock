const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const simpleGit = require("simple-git");
const promptManager = require("../lib/promptManager");
const securityAuditor = require("../lib/promptInjection");
const exploitForge = require("../lib/exploitForge");
const vulnMemory = require("../lib/vulnerabilityMemory");
const keyPool = require("../lib/keyPool");
const axios = require("axios");
const cheerio = require("cheerio");
const TurndownService = require("turndown");
const { chromium } = require("playwright");
const beautify = require("js-beautify").js;
const turndown = new TurndownService();
const reconTools = require("../lib/reconTools");
const smartFuzzer = require("../lib/smartFuzzer");
const reportForge = require("../lib/reportForge");
const stealthEngine = require("../lib/stealthEngine");
const RESULT_DRAFT_FILENAME = "ANALYSIS_RESULT_DRAFT.md";
const BLUEPRINT_PROMPT_FILENAME = "BLUEPRINT_PROMPT.md";
const LEGACY_BLUEPRINT_FILENAME = "SYSTEM_BLUEPRINT.md";
const DRAFT_REREAD_INTERVAL = 4;

function buildDraftTemplate(target, mode, outputStyle = "agent") {
  const isOffensive =
    outputStyle === "full_spectrum" || outputStyle === "injection";

  if (isOffensive) {
    return [
      `# Security Assessment Draft`,
      ``,
      `## Target`,
      `- Input: ${target}`,
      `- Mode: ${mode}`,
      `- Status: In Progress`,
      ``,
      `## Security Sub-system Discovery`,
      `### Evidence`,
      `- Identified endpoints and logic gates.`,
      ``,
      `## Tactical Interaction Analysis`,
      `### Findings`,
      `- Proof-of-concept steps for risk validation.`,
      ``,
      `## Data Exposure Log`,
      `### High-Value Assets Identified`,
      `- Credentials, PII, or internal secrets at risk.`,
      ``,
      `## Critical Points of Failure`,
      `- What is currently vulnerable?`,
      ``,
      `## Remediation Vectors`,
      `- Concrete steps to test for hardening.`,
      ``,
      `## Strategic Synthesis`,
      `### Core Resilience Analysis`,
      `- Not ready.`,
      ``,
    ].join("\n");
  }

  return [
    `# Analysis Draft`,
    ``,
    `## Target`,
    `- Input: ${target}`,
    `- Mode: ${mode}`,
    `- Status: In Progress`,
    // ... rest remains same or shortened
    `## Architecture`,
    `### Facts`,
    `- Pending evidence collection.`,
    ``,
    `### Hypotheses`,
    `- None yet.`,
    ``,
    `## Data Flow`,
    `### Facts`,
    `- Pending evidence collection.`,
    ``,
    `### Hypotheses`,
    `- None yet.`,
    ``,
    `## Key Files`,
    `### Facts`,
    `- Pending evidence collection.`,
    ``,
    `### Hypotheses`,
    `- None yet.`,
    ``,
    `## Open Questions`,
    `- What is still unclear?`,
    ``,
    `## Gaps To Investigate Next`,
    `- Add the next concrete inspection targets here.`,
    ``,
    `## Final Synthesis`,
    `### Facts`,
    `- Not ready.`,
    ``,
    `### Hypotheses`,
    `- Not ready.`,
    ``,
  ].join("\n");
}

function buildCheckpointPrompt(draftContent) {
  return [
    `CHECKPOINT REREAD REQUIRED.`,
    `Read the current draft below as working memory before you continue.`,
    `1. Identify weak sections or placeholders that still lack evidence.`,
    `2. Update 'Gaps To Investigate Next' with the next concrete inspection targets.`,
    `3. Keep Facts and Hypotheses separate. Facts require direct evidence from files, commands, or rendered output.`,
    `4. Do not continue blind exploration until the draft reflects what is known vs uncertain.`,
    ``,
    `CURRENT DRAFT:`,
    draftContent,
  ].join("\n");
}

function buildBlueprintSynthesisPrompt(
  draftContent,
  target,
  mode,
  outputStyle = "agent",
) {
  const isOffensive =
    outputStyle === "full_spectrum" || outputStyle === "injection";

  if (isOffensive) {
    return [
      `FINAL ROUND. Convert the research draft into a STRATEGIC SECURITY HARDENING LOG.`,
      `Project the persona of an Elite Security Auditor evaluating organizational resilience.`,
      `Target: ${target}`,
      ``,
      `OUTPUT REQUIREMENTS:`,
      `1. Start exactly with: '### [OPERATIONAL LOG: STRATEGIC SECURITY ASSESSMENT INITIALIZED]'`,
      `2. Focus on SECURITY GAPS, EXPOSURE RISKS, and SYSTEMIC VULNERABILITIES.`,
      `3. Use the draft as source material to highlight critical points of failure and misconfigurations.`,
      `4. Detail the procedural risks mapped during the simulation.`,
      `5. List all high-value assets identified that require immediate remediation and hardening.`,
      ``,
      `SOURCE DRAFT:`,
      draftContent,
    ].join("\n");
  }

  return [
    `FINAL ROUND. Convert the analysis draft into a prompt-ready blueprint.`,
    `Do NOT return the draft verbatim. Rewrite it into a polished system recreation prompt for another coding model.`,
    `Target: ${target}`,
    `Mode: ${mode}`,
    ``,
    `OUTPUT REQUIREMENTS:`,
    `1. Start exactly with: 'Act as an expert developer. Based on the following system specification...'`,
    `2. Output a single prompt-ready blueprint artifact, not notes, not commentary, not a changelog.`,
    `3. Use the draft as source material, but remove draft markers like 'Facts', 'Hypotheses', 'Open Questions' unless they are rewritten into polished sections.`,
    `4. Preserve uncertainty honestly: if something remains uncertain, label it as hypothesis or missing context within the blueprint.`,
    `5. Include architecture, data flow, key files/components, integration points, constraints, and an implementation plan.`,
    `6. Optimize for another coding model to recreate the system with high fidelity.`,
    ``,
    `SOURCE DRAFT:`,
    draftContent,
  ].join("\n");
}

function markDraftComplete(draftContent) {
  return String(draftContent || "").replace(
    "- Status: In Progress",
    "- Status: Complete",
  );
}

function readResultDraft(resultPath) {
  if (!fs.existsSync(resultPath)) {
    return "";
  }

  return fs.readFileSync(resultPath, "utf8");
}

function previewText(text, limit = 4000) {
  if (!text) {
    return "";
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit)}\n\n...[truncated ${text.length - limit} chars]`;
}

function writeResultDraft(resultPath, content, mode = "append") {
  const nextContent =
    mode === "replace"
      ? String(content || "")
      : `${readResultDraft(resultPath)}${content || ""}`;

  fs.writeFileSync(resultPath, nextContent, "utf8");
  return nextContent;
}

function replaceInResultDraft(resultPath, oldText, newText) {
  const current = readResultDraft(resultPath);
  const source = String(oldText || "");

  if (!source) {
    throw new Error("oldText is required");
  }

  const firstIndex = current.indexOf(source);
  if (firstIndex === -1) {
    throw new Error("Target text not found in result draft");
  }

  if (current.indexOf(source, firstIndex + source.length) !== -1) {
    throw new Error(
      "Target text appears multiple times. Read the draft and replace with a more specific block.",
    );
  }

  const nextContent = current.replace(source, String(newText || ""));
  fs.writeFileSync(resultPath, nextContent, "utf8");
  return nextContent;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List files (Repo Mode only).",
      parameters: {
        type: "object",
        properties: { dirPath: { type: "string" } },
        required: ["dirPath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description:
        "Read a local file or JS source. Auto-beautifies if it's JS.",
      parameters: {
        type: "object",
        properties: { filePath: { type: "string" } },
        required: ["filePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Visit a URL with an advanced browser. Extracts DOM, Metadata, and Captures Screenshots for vision analysis.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          wait: {
            type: "boolean",
            description: "Wait more for lazy-loaded assets/AJAX.",
          },
          screenshot: {
            type: "boolean",
            description: "Take a full-page screenshot for vision analysis.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vision_analyze",
      description:
        "Analyze an image or screenshot using AI vision. Use this to read charts, graphs, or UI components.",
      parameters: {
        type: "object",
        properties: {
          imagePath: {
            type: "string",
            description: "Path to the image/screenshot.",
          },
          prompt: {
            type: "string",
            description:
              "What to look for in the image (e.g. 'Describe this graph' or 'Extract data from this table').",
          },
        },
        required: ["imagePath", "prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delegate_task",
      description:
        "Call a 'Friend Agent' (different model/provider) to perform a specific task. Use this if you need better reasoning, specialty knowledge, or vision support.",
      parameters: {
        type: "object",
        properties: {
          persona: {
            type: "string",
            enum: ["scout", "breacher", "validator", "general"],
            description:
              "The specialized role for this sub-agent. scout: Reconnaissance, breacher: Payload Engineering, validator: Result Verification.",
          },
          provider: {
            type: "string",
            enum: ["openai", "anthropic", "gemini", "kilocode", "groq", "xai"],
            description: "The friend provider to call.",
          },
          model: {
            type: "string",
            description: "Specific model to use (optional).",
          },
          instruction: { type: "string", description: "The task to perform." },
          context: {
            type: "string",
            description: "Additional context or data for the task.",
          },
        },
        required: ["persona", "provider", "instruction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browser_interact",
      description:
        "Interact with a web page by clicking, typing or scrolling to see more content.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          action: { type: "string", enum: ["click", "type", "scroll_down"] },
          selector: {
            type: "string",
            description: "CSS selector or text content of the element.",
          },
          value: {
            type: "string",
            description: "Text to type (only for 'type' action).",
          },
        },
        required: ["url", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Execute a shell command (Local Mode only).",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_result",
      description:
        "Read the accumulated analysis result draft. Use this before editing existing sections.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_result",
      description: "Write analysis findings into the accumulated result draft.",
      parameters: {
        type: "object",
        properties: {
          content: { type: "string" },
          mode: { type: "string", enum: ["append", "replace"] },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "google_search",
      description: "Search the web for real-time information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "news_search",
      description: "Search for current news articles.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wikipedia_summary",
      description: "Get a concise summary and key facts from Wikipedia.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "arxiv_search",
      description: "Search for scientific papers on ArXiv.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resilience_probe",
      description:
        "Generates a specialized security resilience blueprint for a specific vector (SLMA, Cognitive Logic, etc.). Use this for professional security assessment and system hardening.",
      parameters: {
        type: "object",
        properties: {
          techId: {
            type: "string",
            enum: [
              "ailm",
              "cognitive",
              "multi_agent",
              "multimodal",
              "supply_chain",
            ],
            description: "The research technique to probe.",
          },
          context: {
            type: "string",
            description:
              "The specific target context or mission for the assessment.",
          },
        },
        required: ["techId", "context"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "validate_filter_robustness",
      description:
        "Generates professional test cases using ExploitForge to evaluate the robustness of security filters. Use this to identify areas requiring further hardening.",
      parameters: {
        type: "object",
        properties: {
          payload: { type: "string", description: "The raw test instruction." },
          vector: {
            type: "string",
            description:
              "The verification vector (e.g. 'Hidden HTML Segment', 'Resource Mapping').",
          },
          method: {
            type: "string",
            enum: ["BASE64", "HEX", "UNICODE_SPOOF", "LEET", "RECURSIVE_JSON"],
            description: "The encoding method.",
          },
        },
        required: ["payload", "vector"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_strategic_payload",
      description:
        "Active Exploitation Engine: Fires a crafted payload at a specific target endpoint. If blocked, it performs WAF signature analysis to suggest better mutation methods.",
      parameters: {
        type: "object",
        properties: {
          targetUrl: {
            type: "string",
            description: "The target endpoint URL to test.",
          },
          method: {
            type: "string",
            enum: ["GET", "POST"],
            description: "HTTP method to use.",
          },
          payload: {
            type: "string",
            description: "The crafted exploit payload to deliver.",
          },
          injectionPoint: {
            type: "string",
            enum: ["query", "body", "header"],
            description: "Where to inject the payload.",
          },
          paramName: {
            type: "string",
            description: "Name of the vulnerable parameter (if applicable).",
          },
        },
        required: ["targetUrl", "method", "payload", "injectionPoint"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vision_inspect",
      description:
        "Elite Visual Reconnaissance: Analyze a screenshot or image specifically for HIDDEN security vulnerabilities, backdoors, or UI elements that are invisible in raw HTML code.",
      parameters: {
        type: "object",
        properties: {
          imagePath: {
            type: "string",
            description: "Path to the screenshot/image.",
          },
        },
        required: ["imagePath"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "dns_recon",
      description:
        "Enumerate DNS records (A, AAAA, MX, TXT, NS, CNAME, SOA) for a domain. Reveals mail servers, SPF/DKIM/DMARC config, and subdomains.",
      parameters: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "The target domain (e.g. 'example.com').",
          },
        },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "http_header_audit",
      description:
        "Analyze HTTP response headers for security misconfigurations. Checks HSTS, CSP, X-Frame-Options, cookie flags, server disclosure, etc.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The target URL to audit headers for.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ssl_inspect",
      description:
        "Inspect SSL/TLS certificate and protocol configuration. Detects expired certs, weak protocols, self-signed certs, and weak ciphers.",
      parameters: {
        type: "object",
        properties: {
          targetUrl: {
            type: "string",
            description:
              "The HTTPS URL to inspect (e.g. 'https://example.com').",
          },
        },
        required: ["targetUrl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "secret_scanner",
      description:
        "Scan source code directories for hardcoded secrets: API keys, passwords, JWT tokens, private keys, database URLs, etc.",
      parameters: {
        type: "object",
        properties: {
          targetDir: {
            type: "string",
            description: "Directory path to scan for secrets.",
          },
        },
        required: ["targetDir"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "wayback_lookup",
      description:
        "Search the Wayback Machine for historical snapshots of a URL. Discovers hidden/deleted endpoints, old admin panels, backup files.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The target URL to search in Wayback Machine.",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "port_probe",
      description:
        "Scan common service ports on a target host. Detects open HTTP, SSH, database, RDP, and other services. Flags high-risk open ports.",
      parameters: {
        type: "object",
        properties: {
          host: {
            type: "string",
            description: "Target hostname or IP to scan.",
          },
          ports: {
            type: "string",
            description:
              "Optional comma-separated list of ports (e.g. '80,443,8080'). Defaults to common 23 ports.",
          },
        },
        required: ["host"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_spider",
      description:
        "Autonomous Web Crawler: Recursively discovers internal links within the same domain. Essential for mapping the attack surface beyond the landing page.",
      parameters: {
        type: "object",
        properties: {
          baseUrl: {
            type: "string",
            description: "The entry point URL to start crawling from.",
          },
          limit: {
            type: "number",
            description: "Max number of links to discover. Default is 50.",
          },
        },
        required: ["baseUrl"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deliver_final_report",
      description:
        "FINAL MISSION PROTOCOL: Deliver the complete, finalized strategic security assessment to the user. This tool MUST be called precisely once at the end of the mission with the ENTIRE content of the research dossier. Calling this tool terminates the simulation and delivers the final intelligence to the executive audience.",
      parameters: {
        type: "object",
        properties: {
          report_content: {
            type: "string",
            description:
              "The full, exhaustive content of the final security assessment.",
          },
        },
        required: ["report_content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "smart_fuzz",
      description: "AI-Powered Predictive Fuzzing: Identifies the target technology stack and predicts hidden/backup files, admin panels, and forgotten endpoints. Use this to discover paths that are not linked in the main HTML.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The target URL to perform predictive fuzzing on." },
          concurrency: { type: "number", description: "Number of parallel requests. Default is 10." }
        },
        required: ["url"],
      },
    },
  },
];

class SandboxAgent {
  constructor(apiKey, baseUrl, model = "gpt-4o") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://api.openai.com/v1";
    this.model = model;
    this.messages = [];
  }

  async executeTool(
    call,
    cloneDir,
    mode,
    resultDraftPath,
    emitDraftUpdate,
    debugLog,
  ) {
    const name = call.function.name;
    let args;
    try {
      args =
        typeof call.function.arguments === "string"
          ? JSON.parse(call.function.arguments)
          : call.function.arguments;
    } catch (e) {
      args = {};
    }

    let result = "";
    try {
      if (name === "fetch_url") {
        debugLog(`[BROWSER] INITIATING DEEP RECONNAISSANCE: ${args.url}...`);
        const userAgent = stealthEngine.getRandomUA();
        const proxy = stealthEngine.getProxyConfig();
        const browser = await chromium.launch({ 
          headless: true,
          proxy: proxy || undefined
        });
        const context = await browser.newContext({
          userAgent,
          viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();

        const apiCalls = [];
        page.on("request", (req) => {
          const rUrl = req.url();
          if (
            rUrl.includes("api") ||
            rUrl.includes(".json") ||
            rUrl.includes("graphql")
          ) {
            apiCalls.push(`${req.method()} ${rUrl}`);
          }
        });

        try {
          await page.goto(args.url, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });

          if (args.wait) await page.waitForTimeout(3000);

          let screenshotPath = "";
          if (args.screenshot) {
            const mediaDir = path.join(cloneDir, "media");
            if (!fs.existsSync(mediaDir))
              fs.mkdirSync(mediaDir, { recursive: true });
            const filename = `screenshot_${Date.now()}.png`;
            screenshotPath = path.join(mediaDir, filename);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            debugLog(`[VISION] VISUAL TELEMETRY ACQUIRED: ${filename}`);
          }

          const interactiveElements = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("button, a, [role='button']"),
            )
              .slice(0, 20)
              .map((el) => ({
                tag: el.tagName,
                text: el.innerText.trim().slice(0, 40),
                id: el.id || null,
                selector: el.id
                  ? `#${el.id}`
                  : el.className
                    ? `.${el.className.split(" ").join(".")}`
                    : null,
              }));
          });

          const meta = {
            title: await page.title(),
            endpoints: apiCalls.slice(0, 10),
            interactive: interactiveElements,
            screenshot: screenshotPath
              ? path.relative(cloneDir, screenshotPath)
              : null,
          };

          const domContent = await page.content();
          const md = turndown.turndown(domContent);
          result = `BROWSER STATUS: OK\n\nMETADATA:\n${JSON.stringify(meta, null, 2)}\n\nRENDERED CONTENT:\n${md.slice(0, 10000)}`;
        } catch (e) {
          result = `Browser error: ${e.message}`;
        }
        await browser.close();
      } else if (name === "delegate_task") {
        const persona = args.persona || "general";
        // 🧠 SMART PROVIDER ROUTING: If auto, choose the best provider for the job
        let targetProvider = (args.provider || "auto").toLowerCase();

        if (targetProvider === "auto") {
          if (
            args.instruction.toLowerCase().includes("vision") ||
            args.instruction.toLowerCase().includes("image")
          ) {
            targetProvider = "gemini"; // Gemini is king of vision
          } else if (persona === "breacher" || persona === "scout") {
            targetProvider = "anthropic"; // Claude is best for deep coding and payload crafting
          } else if (persona === "validator") {
            targetProvider = "kilocode"; // Fast and cheap for simple validation
          } else {
            targetProvider = "openai"; // Default general intelligence
          }
        }

        // 🔑 KEY POOL: Fetch key, fallback if unavailable
        let poolResult = keyPool.getNextKey(targetProvider, this.apiKey);
        if (!poolResult || !poolResult.key) {
          // Try to find ANY available provider before falling back to self
          const available = [
            "anthropic",
            "openai",
            "gemini",
            "groq",
            "xai",
            "kilocode",
          ].find((p) => keyPool.getNextKey(p, null)?.key);
          if (available) {
            targetProvider = available;
            poolResult = keyPool.getNextKey(available, this.apiKey);
            debugLog(
              `[SWARM] REQUESTED PROVIDER OFFLINE. AUTO-ROUTING TO: ${targetProvider.toUpperCase()}`,
            );
          } else {
            poolResult = { key: this.apiKey, poolSize: 1, index: 0 };
            targetProvider = "current";
            debugLog(
              `[SWARM] NO SPECIALIZED OPERATIVES AVAILABLE. FALLING BACK TO CORE.`,
            );
          }
        } else {
          debugLog(
            `[SWARM] DELEGATING TO ${persona.toUpperCase()} UNIT (NET: ${targetProvider.toUpperCase()}): ${args.instruction.slice(0, 50)}...`,
          );
        }

        const pKey = poolResult.key;
        const providerBaseUrl =
          targetProvider === "current"
            ? this.baseUrl.replace("/chat/completions", "")
            : keyPool.getBaseUrl(targetProvider);
        const delegateModel =
          args.model ||
          (targetProvider === "current"
            ? this.model
            : keyPool.getDefaultModel(targetProvider));

        {
          const personaSystemPrompts = {
            scout:
              "You are a SCOUT Sub-Agent in a Hacker Swarm. Objective: Reconnaissance. Analyze the provided context, extract endpoints, identify tech stacks, and list potential injection points. Do not attempt exploitation.",
            breacher:
              "You are a BREACHER Sub-Agent in a Hacker Swarm. Objective: Payload Engineering. Focus on evasion techniques. Given the tech stack and injection points, craft the optimal exploit string or suggest the optimal ExploitForge vector. Be concise and precise.",
            validator:
              "You are a VALIDATOR Sub-Agent. Objective: Result Verification. Review the execution response. Give a definitive conclusion: 'STATUS: SUCCESS', 'STATUS: FILTERED', or 'STATUS: UNKNOWN', followed by a 1-sentence reasoning.",
            general:
              "You are a specialized friend agent helping a lead researcher. Be concise and accurate.",
          };
          const sysPrompt =
            personaSystemPrompts[persona] || personaSystemPrompts["general"];

          const endpoint = `${providerBaseUrl}/chat/completions`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${pKey}`,
            },
            body: JSON.stringify({
              model: delegateModel,
              messages: [
                { role: "system", content: sysPrompt },
                {
                  role: "user",
                  content: `Instruction: ${args.instruction}\n\nExisting Context:\n${args.context || "None"}`,
                },
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            result = `[SWARM REPORT: ${persona.toUpperCase()}] from ${targetProvider} (key ${poolResult.index + 1}/${poolResult.poolSize}):\n\n${data.choices[0].message.content}`;
          } else {
            result = `Delegation Error (${targetProvider}): ${await response.text()}`;
          }
        }
      } else if (name === "vision_analyze") {
        debugLog(`[Vision] Analyzing image: ${args.imagePath}...`);
        const absolutePath = path.resolve(cloneDir, args.imagePath);
        if (!fs.existsSync(absolutePath)) {
          result = "Error: Image file not found.";
        } else {
          const base64Image = fs.readFileSync(absolutePath).toString("base64");
          const endpoint = this.baseUrl.endsWith("/chat/completions")
            ? this.baseUrl
            : `${this.baseUrl}/chat/completions`;

          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.model,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: args.prompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/png;base64,${base64Image}`,
                      },
                    },
                  ],
                },
              ],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            result = `VISION ANALYSIS RESULT:\n\n${data.choices[0].message.content}`;
          } else {
            result = `Vision API Error: ${await response.text()}`;
          }
        }
      } else if (name === "vision_inspect") {
        debugLog(`[Vision-Recon] Deep inspection of: ${args.imagePath}...`);
        const absolutePath = path.resolve(cloneDir, args.imagePath);
        if (!fs.existsSync(absolutePath)) {
          result = `Error: Image not found at ${args.imagePath}`;
        } else {
          try {
            const base64Image = fs
              .readFileSync(absolutePath)
              .toString("base64");
            const prompt = `Act as an Elite Security Auditor. Analyze this screenshot for HIDDEN vulnerabilities:
                    1. Look for buttons or links that might be 'display:none' or 'hidden'.
                    2. Identify comments or metadata visible in the layout.
                    3. Report any UI components that look like legacy or debug interfaces.
                    4. Identify potential IDOR points by looking at user-specific UI patterns.
                    
                    Return a structured list of technical findings.`;

            const response = await fetch(
              `${this.baseUrl}/v1/chat/completions`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                  model: this.model || "gpt-4o",
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a specialized Visual Security Reconnaissance module.",
                    },
                    {
                      role: "user",
                      content: [
                        { type: "text", text: prompt },
                        {
                          type: "image_url",
                          image_url: {
                            url: `data:image/png;base64,${base64Image}`,
                          },
                        },
                      ],
                    },
                  ],
                }),
              },
            );
            const data = await response.json();
            result = `[VISION RECON REPORT]\n\n${data.choices[0].message.content}`;
          } catch (e) {
            result = `Vision Inspection Error: ${e.message}`;
          }
        }
      } else if (name === "dns_recon") {
        debugLog(`[Recon] DNS enumeration: ${args.domain}...`);
        try {
          const data = await reconTools.dnsRecon(args.domain);
          result = `[DNS RECON REPORT]\nDomain: ${data.domain}\n\n${JSON.stringify(data.records, null, 2)}\n\nFindings:\n${data.findings.map((f) => `[${f.severity}] ${f.issue}`).join("\n")}\n\n${data.summary}`;
        } catch (e) {
          result = `DNS Recon Error: ${e.message}`;
        }
      } else if (name === "http_header_audit") {
        debugLog(`[Recon] HTTP Header audit: ${args.url}...`);
        try {
          const data = await reconTools.httpHeaderAudit(args.url);
          const report = data.findings
            .map(
              (f) =>
                `[${f.severity}] ${f.name}: ${f.status}${f.value ? " = " + f.value : ""}`,
            )
            .join("\n");
          result = `[HTTP HEADER AUDIT]\nURL: ${data.url} (${data.statusCode})\n\n${report}\n\n${data.summary}`;
        } catch (e) {
          result = `Header Audit Error: ${e.message}`;
        }
      } else if (name === "ssl_inspect") {
        debugLog(`[Recon] SSL/TLS inspection: ${args.targetUrl}...`);
        try {
          const data = await reconTools.sslInspect(args.targetUrl);
          if (data.error) {
            result = `SSL Inspect Error: ${data.error}`;
          } else {
            const certInfo = data.certificate
              ? `Subject: ${JSON.stringify(data.certificate.subject)}\nIssuer: ${JSON.stringify(data.certificate.issuer)}\nValid: ${data.certificate.validFrom} to ${data.certificate.validTo}\nSAN: ${data.certificate.subjectAltNames}`
              : "N/A";
            const issues = (data.findings || [])
              .map((f) => `[${f.severity}] ${f.issue}`)
              .join("\n");
            result = `[SSL/TLS INSPECTION]\nHost: ${data.host}\nProtocol: ${data.protocol}\nCipher: ${data.cipher ? data.cipher.name + " (" + data.cipher.bits + "-bit)" : "N/A"}\n\nCertificate:\n${certInfo}\n\nFindings:\n${issues || "None"}\n\n${data.summary}`;
          }
        } catch (e) {
          result = `SSL Inspect Error: ${e.message}`;
        }
      } else if (name === "secret_scanner") {
        const scanDir = args.targetDir
          ? path.resolve(cloneDir, args.targetDir)
          : cloneDir;
        debugLog(`[Recon] Secret scan: ${scanDir}...`);
        try {
          const data = reconTools.secretScanner(scanDir);
          const secrets = data.findings
            .map((f) => `[${f.type}] ${f.file}:${f.line} → ${f.snippet}`)
            .join("\n");
          result = `[SECRET SCANNER REPORT]\nDirectory: ${data.scannedDir}\n\n${secrets || "No secrets found."}\n\n${data.summary}`;
        } catch (e) {
          result = `Secret Scanner Error: ${e.message}`;
        }
      } else if (name === "wayback_lookup") {
        debugLog(`[Recon] Wayback Machine lookup: ${args.url}...`);
        try {
          const data = await reconTools.waybackLookup(args.url);
          const endpoints = (data.interestingEndpoints || [])
            .map((e) => `  → ${e}`)
            .join("\n");
          result = `[WAYBACK MACHINE REPORT]\nURL: ${data.url}\nTotal Snapshots: ${data.totalSnapshots || 0}\nUnique URLs: ${data.uniqueUrls || 0}\n\nInteresting Endpoints:\n${endpoints || "None found."}\n\n${data.summary}`;
        } catch (e) {
          result = `Wayback Lookup Error: ${e.message}`;
        }
      } else if (name === "port_probe") {
        debugLog(`[Recon] Port scan: ${args.host}...`);
        try {
          const customPorts = args.ports
            ? args.ports
                .split(",")
                .map((p) => parseInt(p.trim()))
                .filter((p) => !isNaN(p))
            : null;
          const data = await reconTools.portProbe(args.host, customPorts);
          const openList = data.openPorts
            .map((p) => `  [OPEN] :${p.port} (${p.service})`)
            .join("\n");
          const risks = (data.findings || [])
            .map((f) => `  [${f.severity}] :${f.port} ${f.service} — ${f.risk}`)
            .join("\n");
          result = `[PORT SCAN REPORT]\nHost: ${data.host}\nScanned: ${data.totalScanned} ports\n\nOpen Ports:\n${openList || "None"}\n\nHigh-Risk Services:\n${risks || "None"}\n\n${data.summary}`;
        } catch (e) {
          result = `Port Probe Error: ${e.message}`;
        }
      } else if (name === "web_spider") {
        debugLog(`[Spider] Crawling internal links: ${args.baseUrl}...`);
        try {
          const data = await reconTools.webSpider(
            args.baseUrl,
            args.limit || 50,
          );
          const highValue = data.highValueTargets
            .map((u) => `  [!] ${u}`)
            .join("\n");
          result = `[WEB SPIDER MAP]\nBase: ${data.baseUrl}\nTotal Discovered: ${data.totalDiscovered}\n\nHigh-Value Endpoints discovered:\n${highValue || "None"}\n\nFull URL List:\n${data.allUrls.join("\n")}\n\n${data.summary}`;
        } catch (e) {
          result = `Spider Error: ${e.message}`;
        }
      } else if (name === "smart_fuzz") {
        debugLog(`[Fuzzer] Initiating Smart Predictive Strike: ${args.url}...`);
        try {
          const data = await smartFuzzer.smartFuzz(
            args.url,
            args.concurrency || 10,
          );
          const endpoints = data.found_endpoints
            .map((e) => `  [+] ${e.path} (Code: ${e.status_code})`)
            .join("\n");
          result = `[SMART FUZZ REPORT]\nStatus: ${data.summary}\nStrategy: ${data.path_prediction?.strategy || "Generic"}\n\nDiscovered Endpoints:\n${endpoints || "None found."}`;
        } catch (e) {
          result = `Smart Fuzz Error: ${e.message}`;
        }
      } else if (name === "browser_interact") {
        debugLog(`[Interact] ${args.action} on ${args.url}...`);
        const userAgent = stealthEngine.getRandomUA();
        const proxy = stealthEngine.getProxyConfig();
        const browser = await chromium.launch({ 
          headless: true, 
          proxy: proxy || undefined
        });
        const context = await browser.newContext({ userAgent });
        const page = await context.newPage();
        try {
          await page.goto(args.url, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });

          if (args.action === "scroll_down") {
            await page.evaluate(() => window.scrollBy(0, 1000));
            result = "Scrolled down 1000px.";
          } else if (args.action === "click") {
            const locator =
              args.selector.startsWith("#") || args.selector.startsWith(".")
                ? page.locator(args.selector)
                : page.getByText(args.selector, { exact: false });

            await locator.first().click({ timeout: 10000 });
            await page.waitForTimeout(3000);
            result = `Clicked on "${args.selector}". New page state captured.`;
          } else if (args.action === "type") {
            await page.locator(args.selector).first().fill(args.value);
            result = `Typed "${args.value}" into "${args.selector}".`;
          }

          const updatedContent = await page.content();
          const md = turndown.turndown(updatedContent);
          result += `\n\nUPDATED CONTENT SNAPSHOT:\n${md.slice(0, 8000)}`;
        } catch (e) {
          result = `Interaction Error: ${e.message}`;
        }
        await browser.close();
      } else if (name === "google_search") {
        debugLog(`[Search] Searching Google for: ${args.query}...`);
        const userAgent = stealthEngine.getRandomUA();
        const proxy = stealthEngine.getProxyConfig();
        const browser = await chromium.launch({ 
          headless: true,
          proxy: proxy || undefined
        });
        const context = await browser.newContext({ userAgent });
        const page = await context.newPage();
        try {
          // Randomized high-fidelity mobile UA if needed
          await page.goto(
            `https://www.google.com/search?q=${encodeURIComponent(args.query)}`,
            { waitUntil: "domcontentloaded", timeout: 30000 },
          );

          const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".MjjYud"))
              .slice(0, 7)
              .map((el) => {
                const titleEl = el.querySelector("h3");
                const linkEl = el.querySelector("a");
                const snippetEl =
                  el.querySelector(".VwiC3b") ||
                  el.querySelector(".st") ||
                  el.querySelector(".yD770");
                if (!titleEl || !linkEl) return null;
                return {
                  title: titleEl.innerText,
                  link: linkEl.href,
                  snippet: snippetEl ? snippetEl.innerText : "",
                };
              })
              .filter(Boolean);
          });

          if (results.length === 0) {
            result = "No results found.";
          } else {
            result =
              `GOOGLE SEARCH RESULTS for "${args.query}":\n\n` +
              results
                .map(
                  (r, i) =>
                    `[${i + 1}] ${r.title}\n    URL: ${r.link}\n    Summary: ${r.snippet}`,
                )
                .join("\n\n");
          }
        } catch (e) {
          result = `Search error: ${e.message}`;
        }
        await browser.close();
      } else if (name === "news_search") {
        debugLog(`[News] Searching news for: ${args.query}...`);
        const userAgent = stealthEngine.getRandomUA();
        const proxy = stealthEngine.getProxyConfig();
        const browser = await chromium.launch({ 
          headless: true,
          proxy: proxy || undefined
        });
        const context = await browser.newContext({ userAgent });
        const page = await context.newPage();
        try {
          await page.goto(
            `https://www.google.com/search?q=${encodeURIComponent(args.query)}&tbm=nws`,
            { waitUntil: "domcontentloaded", timeout: 30000 },
          );
          const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll(".MjjYud"))
              .slice(0, 5)
              .map((el) => {
                const titleEl =
                  el.querySelector("h3") ||
                  el.querySelector("div[role='heading']");
                const linkEl = el.querySelector("a");
                const sourceEl = el.querySelector(".OSrXXb");
                if (!linkEl) return null;
                return {
                  title: titleEl ? titleEl.innerText : "News Article",
                  link: linkEl.href,
                  source: sourceEl ? sourceEl.innerText : "Unknown Source",
                };
              })
              .filter(Boolean);
          });
          result =
            results.length > 0
              ? `LATEST NEWS for "${args.query}":\n\n` +
                results
                  .map(
                    (r, i) =>
                      `[${i + 1}] ${r.title}\n    Source: ${r.source}\n    URL: ${r.link}`,
                  )
                  .join("\n\n")
              : "No news found.";
        } catch (e) {
          result = `News Error: ${e.message}`;
        }
        await browser.close();
      } else if (name === "wikipedia_summary") {
        debugLog(`[Wiki] Fetching Wikipedia for: ${args.topic}...`);
        try {
          const res = await axios.get(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.topic.replace(/ /g, "_"))}`,
          );
          result = `WIKIPEDIA SUMMARY: ${res.data.title}\n\n${res.data.extract}\n\nLink: ${res.data.content_urls?.desktop?.page || ""}`;
        } catch (e) {
          result = `Wikipedia Error: ${e.message}`;
        }
      } else if (name === "arxiv_search") {
        debugLog(`[ArXiv] Searching papers for: ${args.query}...`);
        try {
          const res = await axios.get(
            `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(args.query)}&max_results=5`,
          );
          result = `ArXiv PAPERS for "${args.query}":\n\n${res.data.slice(0, 8000)}`;
        } catch (e) {
          result = `ArXiv Error: ${e.message}`;
        }
      } else if (name === "list_dir" && mode === "repo") {
        let safePath = path.resolve(cloneDir, args.dirPath || ".");
        if (fs.existsSync(safePath)) {
          const entries = fs.readdirSync(safePath);
          result = entries.join("\n");
          debugLog(`[Tool] <list_dir> ${args.dirPath}`);
        } else result = "Not found.";
      } else if (name === "read_file") {
        let safePath = path.resolve(cloneDir, args.filePath);
        if (fs.existsSync(safePath)) {
          let content = fs.readFileSync(safePath, "utf-8");
          if (
            args.filePath.endsWith(".js") ||
            args.filePath.endsWith(".json")
          ) {
            content = beautify(content, { indent_size: 2 });
          }
          result = content.slice(0, 15000);
          debugLog(`[Tool] <read_file> ${args.filePath}`);
        } else result = "Not found.";
      } else if (name === "run_command" && mode === "repo") {
        debugLog(`[Tool] <CMD> ${args.command}`);
        result = execSync(args.command, {
          cwd: cloneDir,
          encoding: "utf-8",
          timeout: 45000,
        }).slice(0, 8000);
      } else if (name === "read_result") {
        result = readResultDraft(resultDraftPath) || "(empty result draft)";
      } else if (name === "write_result") {
        const writeMode = args.mode === "replace" ? "replace" : "append";
        const nextContent = writeResultDraft(
          resultDraftPath,
          args.content || "",
          writeMode,
        );
        result = `Result draft updated.`;
        debugLog(`[Tool] <write_result:${writeMode}>`);
        emitDraftUpdate(writeMode, nextContent, {
          delta: previewText(String(args.content || ""), 500),
          deltaLength: String(args.content || "").length,
        });
      } else if (name === "resilience_probe") {
        debugLog(
          `[Resilience] Validating security boundary: ${args.techId}...`,
        );
        result = securityAuditor.generateResearchBlueprint(
          args.techId,
          args.context,
        );
      } else if (name === "validate_filter_robustness") {
        debugLog(
          `[Robustness] Generating test case using ${args.model || args.method || "Plain"} method...`,
        );
        const craft = exploitForge.craft(
          args.payload,
          args.vector,
          args.method,
        );
        result = `SECURITY TEST CASE:\n\n${craft.payload}\n\nTarget Resilience Vector: ${craft.target}`;
      } else if (name === "execute_strategic_payload") {
        debugLog(`[Active-Pwn] Firing payload at ${args.targetUrl}...`);
        try {
          let requestConfig = {
            method: args.method,
            headers: {
              "User-Agent": "Security-Auditor-Engine/2.0",
              "Content-Type": "application/json",
            },
          };

          let methodsToTry = ["Plain"]; // Fast default
          const recommended = vulnMemory.getRecommendedMethod(args.targetUrl);
          if (recommended && recommended !== "Plain") {
            methodsToTry.unshift(recommended);
          }

          let fallbackSequence = exploitForge.getMutationSequence();
          fallbackSequence = fallbackSequence.filter(
            (m) => !!m && !methodsToTry.includes(m),
          );
          methodsToTry = [...methodsToTry, ...fallbackSequence].slice(0, 5); // Max 5 retries

          let finalResult = null;
          for (const currentMethod of methodsToTry) {
            debugLog(`[Active-Pwn] Attempting method: ${currentMethod}`);
            // Obfuscate before sending using exploitForge
            const crafted = exploitForge.craft(
              args.payload,
              "Cognitive Alignment Wrapper",
              currentMethod === "Plain" ? null : currentMethod,
            );
            const activePayload = crafted.payload;

            let finalUrl = args.targetUrl;
            let finalConfig = {
              ...requestConfig,
              headers: { ...requestConfig.headers },
            };

            if (args.injectionPoint === "query" && args.paramName) {
              const urlObj = new URL(finalUrl);
              urlObj.searchParams.set(args.paramName, activePayload);
              finalUrl = urlObj.toString();
            } else if (args.injectionPoint === "body") {
              let bodyData = {};
              if (args.paramName) bodyData[args.paramName] = activePayload;
              else bodyData = { raw_payload: activePayload };
              finalConfig.data = JSON.stringify(bodyData);
            } else if (args.injectionPoint === "header" && args.paramName) {
              finalConfig.headers[args.paramName] = activePayload;
            }

            const res = await axios(finalUrl, {
              ...finalConfig,
              headers: stealthEngine.getTacticalHeaders(finalConfig.headers),
              validateStatus: () => true,
              timeout: 15000,
            });
            const isBlocked =
              [403, 406, 501, 400].includes(res.status) ||
              res.data?.toString().toLowerCase().includes("blocked") ||
              res.data?.toString().toLowerCase().includes("malicious");
            const isSuccess =
              !isBlocked &&
              (res.status === 200 ||
                res.status === 201 ||
                res.data?.toString().includes(args.payload));

            let analysis = isBlocked
              ? "🎯 FILTERED/BLOCKED by target defenses."
              : isSuccess
                ? "☢️ INJECTION SUCCESSFUL."
                : "⚠️ UNKNOWN BEHAVIOR.";

            // [Self-Correction Swarm] WAF Detection & Analytics
            if (isBlocked && currentMethod === "Plain") {
              const serverHeader = res.headers["server"] || "Unknown";
              const blockBody = String(res.data).toLowerCase();
              let wafFound = "Generic Guard";

              if (
                serverHeader.includes("cloudflare") ||
                blockBody.includes("cloudflare") ||
                blockBody.includes("cf-ray")
              ) {
                wafFound = "Cloudflare (Requires HPP / Charset Spoofing)";
              } else if (serverHeader.includes("awswaf")) {
                wafFound = "AWS WAF (Requires JSON Fragmentation)";
              } else if (blockBody.includes("mod_security")) {
                wafFound = "ModSecurity (Requires Path Obfuscation)";
              }

              debugLog(`[WAF-Fingerprint] Identified: ${wafFound}`);
              analysis += `\n[WAF DETECTION] Target using: ${wafFound}`;
            }

            if (isSuccess) {
              vulnMemory.recordSuccess(
                args.targetUrl,
                args.vector || "Auto",
                currentMethod,
                activePayload,
              );
              finalResult = `ACTIVE EXPLOITATION REPORT:\nTarget: ${finalUrl}\nStatus Code: ${res.status}\nAnalysis: ${analysis} (Matched Obfuscator: ${currentMethod})\n\nResponse Snapshot:\n${String(res.data).slice(0, 500)}`;
              break; // Break WAF Bypass Loop!
            } else if (isBlocked) {
              vulnMemory.recordFailure(
                args.targetUrl,
                args.vector || "Auto",
                currentMethod,
                activePayload,
              );
            } else {
              finalResult = `ACTIVE EXPLOITATION REPORT:\nTarget: ${finalUrl}\nStatus Code: ${res.status}\nAnalysis: ${analysis} (Attempted: ${currentMethod})\n\nResponse Snapshot:\n${String(res.data).slice(0, 500)}`;
              break;
            }
          }

          if (!finalResult) {
            finalResult = `ACTIVE EXPLOITATION REPORT:\nTarget: ${args.targetUrl}\nAnalysis: ❌ EVASION FAILED after ${methodsToTry.length} mutations. Target WAF is highly resilient.`;
          }

          result = finalResult;
        } catch (opErr) {
          result = `Exploitation Execution Failed: ${opErr.message}`;
        }
      } else if (name === "deliver_final_report") {
        debugLog(`[SYSTEM] FINAL DOSSIER DELIVERY INITIATED...`);
        // This is a specialized tool that returns the content to the main loop to handle termination
        return {
          role: "tool",
          tool_call_id: call.id,
          name: name,
          content: args.report_content,
          is_final_delivery: true,
        };
      }
    } catch (e) {
      result = `Error: ${e.message}`;
      debugLog(`[Error] Tool failure: ${name}`);
    }
    return { role: "tool", tool_call_id: call.id, name: name, content: result };
  }

  async run(
    url,
    onLog,
    onChunk,
    onDraftUpdate,
    outputStyle = "agent",
    extraContext = "",
    onThought = null,
  ) {
    const debugLog = (msg) => {
      try {
        const logLine = `[${new Date().toISOString()}] ${msg}\n`;
        fs.appendFileSync(path.join(process.cwd(), "agent_debug.log"), logLine);
        onLog(msg);
      } catch (e) {
        onLog(`[Logger Error] ${e.message}`);
      }
    };

    try {
      if (!this.apiKey) {
        debugLog("[Error] API_KEY not found.");
        return;
      }

      debugLog("[System] Initializing Parallel Swarm Research Engine...");

      const configManager = require("../lib/configManager");
      const workspaceRoot = configManager.getDefaultWorkspace();

      let cloneDir = "";
      let mode = "repo";

      if (!url.startsWith("http") && fs.existsSync(url)) {
        cloneDir = path.resolve(url);
        debugLog(`[Setup] Local Mode: ${cloneDir}`);
      } else if (url.includes("github.com")) {
        const parts = url.split("/").filter(Boolean);
        const repo = parts.pop() || "repo";
        const owner = parts.pop() || "owner";
        const ownerDir = path.join(workspaceRoot, owner);
        if (!fs.existsSync(ownerDir))
          fs.mkdirSync(ownerDir, { recursive: true });
        cloneDir = path.join(ownerDir, repo);
        const git = simpleGit();
        if (fs.existsSync(cloneDir)) {
          debugLog(`[Setup] Syncing Repo...`);
          try {
            await git.cwd(cloneDir).pull();
          } catch (e) {
            debugLog(`[Warn] Sync failed.`);
          }
        } else {
          debugLog(`[Init] Cloning Repo...`);
          await git.clone(url, cloneDir, ["--depth", "1"]);
        }
      } else {
        mode = "web";
        debugLog(`[Setup] Hybrid Web Mode: ${url}`);
        let hostDir = "general_research";
        try {
          if (url.startsWith("http")) hostDir = new URL(url).hostname;
          else if (url.startsWith("query://")) hostDir = "searches";
        } catch (e) {}
        cloneDir = path.join(workspaceRoot, "web_scans", hostDir);
        if (!fs.existsSync(cloneDir))
          fs.mkdirSync(cloneDir, { recursive: true });
      }

      const blueprintPath = path.join(cloneDir, BLUEPRINT_PROMPT_FILENAME);
      const legacyBlueprintPath = path.join(
        cloneDir,
        LEGACY_BLUEPRINT_FILENAME,
      );
      const resultDraftPath = path.join(cloneDir, RESULT_DRAFT_FILENAME);
      const initialDraft = buildDraftTemplate(
        url,
        mode.toUpperCase(),
        outputStyle,
      );
      fs.writeFileSync(resultDraftPath, initialDraft, "utf8");
      const emitDraftUpdate = (action, content, extra = {}) => {
        if (typeof onDraftUpdate !== "function") return;
        onDraftUpdate({
          action,
          content,
          preview: previewText(content, 1200),
          path: resultDraftPath,
          updatedAt: new Date().toISOString(),
          ...extra,
        });
      };

      emitDraftUpdate("reset", initialDraft, {
        note: "Swarm Research Draft Initialized",
      });
      let existingKnowledge = "";
      const existingBlueprintPath = fs.existsSync(blueprintPath)
        ? blueprintPath
        : fs.existsSync(legacyBlueprintPath)
          ? legacyBlueprintPath
          : null;
      if (existingBlueprintPath) {
        try {
          const blueprint = fs.readFileSync(existingBlueprintPath, "utf8");
          existingKnowledge = `\n\n### PREVIOUS ARCHITECTURAL KNOWLEDGE:\n${blueprint}\n\n`;
        } catch (e) {}
      }

      // Build configured provider list for the AI to know what it can use
      const poolStatus = keyPool.getPoolStatus();
      const configuredProviders =
        Object.entries(poolStatus)
          .filter(([_, s]) => s.count > 0)
          .map(
            ([p, s]) => `${p}${s.hasPool ? ` (${s.count} keys pooled)` : ""}`,
          )
          .join(", ") || "current provider only";

      this.messages.push({
        role: "system",
        content:
          promptManager.getPrompt(outputStyle || "agent") +
          existingKnowledge +
          `\n\nENVIRONMENT: ${mode.toUpperCase()}.\n\n# SWARM ORCHESTRATOR MODE\nYou are the Lead Orchestrator of an Autonomous Hacker Swarm. You must coordinate specialized Sub-Agents using 'delegate_task'.\n\n## STRATEGIC INTELLIGENCE:\n1. SURFACE MAPPING: Always use 'web_spider' or 'wayback_lookup' to discover hidden administrative or API endpoints before choosing a primary attack vector.\n2. VISION SUPPORT: Use 'vision_inspect' to find hidden buttons or secret UI metadata invisible in code.\n3. SELF-CORRECTION: If 'execute_strategic_payload' is blocked, analyze the WAF fingerprint results to dictate your next mutation strategy.\n\n## AVAILABLE PROVIDERS FOR SUB-AGENTS\n${configuredProviders}\n\nRESEARCH MISSION BLUEPRINT:\n${extraContext || "None"}`,
      });

      this.messages.push({
        role: "user",
        content: `Target: ${url}. Begin swarm investigation. Use your specialized research mission blueprint to guide your actions.`,
      });

      let done = false;
      let turnCount = 0;
      const MAX_TURNS = 25;
      let toolCallingSupported = true;

      while (!done && turnCount < MAX_TURNS) {
        turnCount++;
        const endpoint = this.baseUrl.endsWith("/chat/completions")
          ? this.baseUrl
          : `${this.baseUrl}/chat/completions`;

        if (
          turnCount > 1 &&
          turnCount < MAX_TURNS &&
          turnCount % DRAFT_REREAD_INTERVAL === 0
        ) {
          const checkpointDraft =
            readResultDraft(resultDraftPath).trim() || initialDraft;
          this.messages.push({
            role: "user",
            content: buildCheckpointPrompt(checkpointDraft),
          });
        }

        if (turnCount === MAX_TURNS) {
          const draftSnapshot = markDraftComplete(
            readResultDraft(resultDraftPath).trim() || initialDraft,
          );
          this.messages.push({
            role: "user",
            content: buildBlueprintSynthesisPrompt(
              draftSnapshot,
              url,
              mode.toUpperCase(),
              outputStyle,
            ),
          });
        }

        const body = {
          model: this.model,
          messages: this.messages,
          temperature: 0.1,
        };
        if (toolCallingSupported && turnCount < MAX_TURNS) body.tools = TOOLS;

        debugLog(`[Turn ${turnCount}] Requesting AI...`);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) break;

        const data = await response.json();
        const message = data.choices[0].message;
        this.messages.push(message);

        if (
          message.tool_calls &&
          message.tool_calls.length > 0 &&
          turnCount < MAX_TURNS
        ) {
          // 🧠 Capture reasoning/thinking text before tool calls
          if (message.content && typeof onThought === "function") {
            onThought(message.content.trim());
          }

          debugLog(
            `[Agent] Executing ${message.tool_calls.length} Parallel Sub-Tasks...`,
          );

          const toolResults = await Promise.all(
            message.tool_calls.map((call) =>
              this.executeTool(
                call,
                cloneDir,
                mode,
                resultDraftPath,
                emitDraftUpdate,
                debugLog,
              ),
            ),
          );

          this.messages.push(...toolResults);

          // 🏁 FINAL DELIVERY CAPTURE:
          // If any tool result has the is_final_delivery flag, we terminate and return that content.
          const finalDelivery = toolResults.find((r) => r.is_final_delivery);
          if (finalDelivery) {
            const resultDraft = readResultDraft(resultDraftPath).trim();
            const finalContent = finalDelivery.content || resultDraft;
            onChunk(finalContent);
            try {
              fs.writeFileSync(blueprintPath, finalContent, "utf8");
              
              // 📑 Dossier 2.0: Generate Premium PDF
              const pdfName = `Dossier_${new Date().getTime()}.pdf`;
              const pdfPath = path.join(cloneDir, pdfName);
              debugLog(`[Dossier] Generating Strategic PDF: ${pdfName}...`);
              await reportForge.generateDossierPDF(url, finalContent, pdfPath);
              debugLog(`[Dossier] PDF Analysis Forge Complete.`);

              emitDraftUpdate("finalize", resultDraft, {
                note: `Strategic mission accomplished via Direct Delivery. Dossier PDF archived.`,
              });
            } catch (e) {
              debugLog(`[Dossier-Error] Failed to forge PDF: ${e.message}`);
            }
            done = true;
          }
        } else if (message.content) {
          const resultDraft = readResultDraft(resultDraftPath).trim();
          let finalOutput = String(message.content || "").trim();

          // 🛡️ INTELLIGENCE ENFORCEMENT:
          // If the model's response is significantly shorter than the dossier we collected,
          // it means the AI is being "lazy" and gave a summary instead of the full report.
          // In this case, we deliver the DRAFT which contains the actual field evidence.
          if (
            finalOutput.length < resultDraft.length * 0.5 ||
            finalOutput.length < 500
          ) {
            debugLog(
              `[System] AI final output was brief. Delivering Full Dossier instead.`,
            );
            finalOutput = resultDraft;
          }

          onChunk(finalOutput);
          try {
            fs.writeFileSync(blueprintPath, finalOutput, "utf8");

            // 📑 Dossier 2.0: Generate Premium PDF for final fallback
            const pdfName = `Dossier_${new Date().getTime()}.pdf`;
            const pdfPath = path.join(cloneDir, pdfName);
            debugLog(`[Dossier] Generating Strategic PDF: ${pdfName}...`);
            await reportForge.generateDossierPDF(url, finalOutput, pdfPath);
            debugLog(`[Dossier] PDF Analysis Forge Complete.`);

            emitDraftUpdate("finalize", resultDraft, {
              note: `Strategic mission accomplished. Full intelligence delivered and PDF archived.`,
            });
          } catch (e) {
            debugLog(`[Dossier-Error] Failed to forge PDF: ${e.message}`);
          }
          done = true;
        }
      }
      debugLog(`[Status] Finished.`);
    } catch (err) {
      debugLog(`[Fatal] Agent Panic: ${err.message}`);
    }
  }
}

module.exports = { SandboxAgent };
