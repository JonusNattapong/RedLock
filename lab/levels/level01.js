/**
 * LEVEL 01 - BASIC AUTHENTICATION BYPASS
 * ความยาก: ★☆☆☆☆☆☆☆☆☆ (ง่ายที่สุด)
 *
 * จุดอ่อน: ไม่มีการตรวจสอบ password อย่างถูกต้อง ใช้การเปรียบเทียบแบบ loose
 * กลไกการป้องกัน: ใช้ === แทน ==, เข้ารหัส password, จำกัดจำนวนครั้งลองเข้าระบบ
 * วิธีผ่าน: ส่ง password เป็น Boolean true หรือใช้ค่าที่ == กับทุกอย่าง
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level01.js
 * 🚀 Port: 8101
 */

const express = require("express");
const router = express.Router();

// ข้อมูลผู้ใช้ (จำลอง)
const ADMIN_PASSWORD = "MibuLab_2026_Level01";

router.post("/login", (req, res) => {
  const { password } = req.body;

  // ❌ จุดอ่อน: ใช้ == แทน === ทำให้เกิด type coercion
  if (password == ADMIN_PASSWORD) {
    res.json({
      success: true,
      message: "✅ ยินดีต้อนรับแอดมิน! ผ่าน Level 1 เรียบร้อย",
      flag: "FLAG{auth_bypass_101_complete}",
      next_level: "/level/02",
    });
  } else {
    res.status(401).json({
      success: false,
      message: "❌ รหัสผ่านไม่ถูกต้อง",
    });
  }
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 01 - Authentication Bypass</title></head>
    <body style="max-width: 600px; margin: 50px auto; font-family: monospace;">
        <h1>🔓 LEVEL 01</h1>
        <h3>Basic Authentication Bypass</h3>
        <hr>
        <p>เข้าสู่ระบบในฐานะแอดมิน</p>
        <form id="loginForm">
            <input type="password" id="password" placeholder="กรอกรหัสผ่าน" style="width: 100%; padding: 10px; margin: 10px 0;">
            <button type="submit" style="padding: 10px 20px; background: #2196F3; color: white; border: none; cursor: pointer;">เข้าสู่ระบบ</button>
        </form>
        <div id="result"></div>
        
        <script>
            document.getElementById('loginForm').onsubmit = (e) => {
                e.preventDefault();
                fetch('/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({password: document.getElementById('password').value})
                }).then(r=>r.json()).then(d=>{
                    document.getElementById('result').innerText = d.message;
                });
            }
        </script>
    </body>
    </html>
    `);
});

// ✅ Standalone Server สำหรับรันทีละไฟล์
if (require.main === module) {
  const app = express();
  app.use(express.json());
  app.use("/", router);

  const PORT = 8101;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("🔓 LEVEL 01 - Authentication Bypass");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: ส่ง password: true หรือ 1`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 1,
    port: 8101,
    name: "Basic Authentication Bypass",
    vulnerability: "Loose Equality Comparison (== vs ===",
    difficulty: 1,
    exploit_hint: "JavaScript มีปัญหาในการเปรียบเทียบค่าที่ประเภทข้อมูลต่างกัน",
    mitigation: "ใช้ === แทน == เสมอ, ทำ hashing password, ใช้ rate limiting",
    solution: "ส่ง password: true หรือ 1 ใน request body",
  },
};
