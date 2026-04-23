# AGENTS.md
# For AI coding agents operating in the AuditorAi / Mibu-101 repository

---

## 🚀 BUILD / RUN / LINT / TEST COMMANDS

### Core Commands
```bash
# Install dependencies
npm install

# Start main CLI
npm start

# Start web server
npm run web

# Start TUI interface
npm run tui

# Development watch mode (auto-reload server)
npm run dev

# Syntax check all main files
npm run check
```

### Single File Operations
```bash
# Check syntax of a specific file
node --check path/to/file.js

# Run an individual lab level
node lab/levels/levelXX.js

# Run lib module directly
node lib/moduleName.js
```

---

## 📐 CODE STYLE GUIDELINES

### 1. IMPORTS
- Use CommonJS `require()` exclusively - NO ES Modules `import`
- Group imports: builtins first, then 3rd party, then local modules
- No unused imports
- Use relative paths for local files (`../lib/`, not absolute)
- Avoid `require()` inside functions unless explicitly required

### 2. FORMATTING
- Indent: 2 spaces (no tabs)
- Line length: max 120 characters
- Line endings: LF
- One empty line between logical blocks
- No trailing whitespace
- Opening braces on same line: `if (condition) {`
- Consistent spacing around operators: `const x = 5 + 3;`

### 3. TYPES & VARIABLES
- Use `const` for all values that don't change
- Use `let` only when reassignment is required
- NEVER use `var`
- Prefer descriptive variable names over short abbreviations
- Booleans should start with `is`, `has`, `can`, `should`
- All strings use double quotes `"`
- No magic numbers - define constants with clear names

### 4. NAMING CONVENTIONS
| Type               | Convention            | Example
|--------------------|-----------------------|------------------------
| Variables          | camelCase             | `vulnerabilityScore`
| Functions          | camelCase             | `parseResponseHeader`
| Classes            | PascalCase            | `SmartFuzzer`
| Constants          | UPPER_SNAKE_CASE      | `MAX_RETRY_ATTEMPTS`
| Files              | camelCase.js          | `promptManager.js`
| Directories        | lowercase-dash        | `lab/levels/`
| JSON keys          | camelCase             | `auditTimestamp`

### 5. ERROR HANDLING
- Always handle errors with `try/catch` for async operations
- Wrap all external API calls in try blocks
- Always log errors with meaningful context
- Never swallow errors silently with empty `catch` blocks
- Throw `new Error()` with descriptive messages
- Use `process.exitCode` not immediate `process.exit()` for graceful shutdown

### 6. FUNCTIONS
- Keep functions under 50 lines where possible
- Single responsibility principle
- Maximum 4 parameters - use options object for more
- Always return early for validation failures
- No nested callbacks deeper than 2 levels
- Prefer async/await over Promise chains

### 7. COMMENTS
- Write code that doesn't need comments first
- Only comment *why* not *what* the code does
- No commented out dead code - delete it
- Use `// TODO: description` for temporary notes
- No docblocks unless explicitly requested

---

## ✅ AGENT BEST PRACTICES

### Working in this repository:
1. **Never introduce breaking changes** to existing lab levels
2. **Preserve all existing functionality** - this is an auditing tool
3. **Test changes** before committing - run `npm run check`
4. **Don't add new dependencies** without explicit approval
5. **Don't reformat existing code** unless fixing bugs
6. **Maintain consistency** with existing patterns in the file you edit

### Security:
- Never commit secrets, API keys, tokens, or .env files
- All network calls should validate inputs properly
- No shell execution unless absolutely required
- Sanitize all user inputs before processing

### Code Quality:
- No dead code
- No console.log spam - use proper logging utilities
- No hardcoded paths - use `path.resolve()`
- Handle edge cases explicitly
- Prefer existing utility functions over writing new ones

### Pull Requests:
- Keep PRs small and focused
- Describe the *reason* for changes not just what changed
- Reference related issues if applicable
- Verify all existing tests still pass

---

## 📁 DIRECTORY STRUCTURE

```
lib/               Core library modules
  smartFuzzer.js
  promptManager.js
  reconTools.js
  exploitForge.js
server/            Web server and proxy
cli/               Terminal UI interface
lab/               Security lab environment
  levels/          Individual lab challenges
output/            Generated report outputs
dossiers/          Audit reference materials
```

---

> This file is used by Claude, OpenCode, Cursor and other AI coding agents.
> Last updated: 2026-04-21
