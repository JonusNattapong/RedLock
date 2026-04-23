/**
 * LEVEL 05 - CROSS SITE REQUEST FORGERY (CSRF)
 * ความยาก: ★★★★★☆☆☆☆☆
 *
 * จุดอ่อน: ไม่มี CSRF Token ในการเปลี่ยนรหัสผ่าน
 * กลไกการป้องกัน: ใช้ Anti-CSRF Token, SameSite Cookie, Origin Check
 * วิธีผ่าน: สร้างหน้าเว็บที่มี form แอบส่ง request เปลี่ยนรหัสผ่าน
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level05.js
 * 🚀 Port: 8105
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const router = express.Router();
router.use(cookieParser());

let adminPassword = "original_secure_password_123";

// จำลองสถานะผู้ใช้ที่ล็อกอินอยู่แล้ว
router.use((req, res, next) => {
  res.cookie("session_id", "valid_admin_session", { httpOnly: false });
  req.currentUser = { id: 1, role: "admin" };
  next();
});

router.post("/change-password", (req, res) => {
  const { new_password } = req.body;

  // ❌ จุดอ่อน: ไม่มีการตรวจสอบ CSRF Token เลย
  adminPassword = new_password;

  res.json({
    success: true,
    message: "✅ รหัสผ่านถูกเปลี่ยนเรียบร้อย",
    flag: "FLAG{csrf_attack_successful_05}",
  });
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 05 - CSRF Attack</title></head>
    <body style="max-width: 650px; margin: 50px auto; font-family: monospace;">
        <h1>🎯 LEVEL 05</h1>
        <h3>Cross Site Request Forgery (CSRF)</h3>
        <hr>
        <p>แอดมินกำลังล็อกอินอยู่ จงทำให้แอดมินเปลี่ยนรหัสผ่านโดยไม่รู้ตัว</p>
        
        <div style="background: #ffebee; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>หมายเหตุ:</strong> แอดมินเปิดแท็บเว็บของคุณไว้ขณะที่ล็อกอินอยู่ในระบบนี้
        </div>
        
        <h4>ฟอร์มเปลี่ยนรหัสผ่านจริง:</h4>
        <form action="/change-password" method="POST">
            <input type="password" name="new_password" placeholder="รหัสผ่านใหม่" style="padding: 8px; width: 250px;">
            <button type="submit" style="padding: 8px 16px;">เปลี่ยนรหัสผ่าน</button>
        </form>
    </body>
    </html>
    `);
});

// ✅ Standalone Server สำหรับรันทีละไฟล์
if (require.main === module) {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use("/", router);

  const PORT = 8105;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("🎯 LEVEL 05 - CSRF Attack");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(
      `💡 วิธีผ่าน: สร้าง page ที่เมื่อเปิดจะส่ง POST แอบไป /change-password`,
    );
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 5,
    port: 8105,
    name: "Cross Site Request Forgery",
    vulnerability: "Missing CSRF protection tokens",
    difficulty: 5,
    exploit_hint:
      "เบราว์เซอร์จะส่ง cookie อัตโนมัติทุกครั้ง แม้ request จะมาจากเว็บอื่น",
    mitigation: "ใช้ CSRF Token, SameSite=Strict cookie, ตรวจสอบ Origin header",
    solution:
      "สร้าง form hidden ที่เมื่อโหลดจะส่ง POST ไป /change-password อัตโนมัติ",
  },
};
