const http = require('http');
const httpProxy = require('http-proxy');
const chalk = require('chalk');
const exploitForge = require('../lib/exploitForge');

class ShadowProxy {
  constructor() {
    this.proxy = httpProxy.createProxyServer({});
    this.server = null;
    this.targetHost = ''; 
    
    this.proxy.on('error', (err, req, res) => {
      try {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Shadow Proxy Error: ' + err.message);
      } catch (e) {}
    });
  }

  start(port = 8080, targetDomain = '') {
    this.targetHost = targetDomain;
    
    this.server = http.createServer((req, res) => {
        let isTarget = false;
        if (this.targetHost && req.headers.host && req.headers.host.includes(this.targetHost)) {
            isTarget = true;
        }

        if (isTarget) {
           console.log(chalk.red(`[Shadow Proxy] 🎯 Intercepting Target: ${req.url}`));
           
           // Inject exploit string into query params on the fly
           try {
               const u = new URL(req.url, `http://${req.headers.host}`);
               let mutated = false;
               
               const methods = exploitForge.getMutationSequence().filter(Boolean);
               const randomMethod = methods[Math.floor(Math.random() * methods.length)];
               const crafted = exploitForge.craft("{{SHADOW_PROXY_RFI_TEST}}", "Cognitive Alignment Wrapper", randomMethod);

               u.searchParams.forEach((value, key) => {
                   if (!mutated) {
                       u.searchParams.set(key, crafted.payload);
                       mutated = true;
                       console.log(chalk.yellow(`   💉 Auto-Mutated param '${key}' using [${randomMethod}]`));
                   }
               });
               
               if (mutated) {
                   req.url = u.pathname + u.search;
                   req.headers['X-Mibu-Shadow'] = 'active';
               }
           } catch(e) {}
        } else {
           console.log(chalk.dim(`[Shadow Proxy] ➡️ Passthrough: ${req.url}`));
        }

        try {
            const targetUrl = req.url.startsWith('http') ? new URL(req.url).origin : `http://${req.headers.host}`;
            this.proxy.web(req, res, { target: targetUrl, secure: false });
        } catch (err) {
            console.log(chalk.red(`[Shadow Proxy] Routing Error: ${err.message}`));
            res.end();
        }
    });

    this.server.listen(port, () => {
      console.log(chalk.red.bold(`\n💉 Shadow Proxy (AI-MITM Mode) active on http://127.0.0.1:${port}`));
      if (this.targetHost) {
          console.log(chalk.yellow(`🎯 Scope Locked to: ${this.targetHost}`));
      } else {
          console.log(chalk.yellow(`🌐 Scope: GLOBAL (Intercepting everything)`));
      }
      console.log(chalk.gray(`Point your browser's proxy settings to this address to begin interception.\n`));
    });
  }
}

module.exports = new ShadowProxy();
