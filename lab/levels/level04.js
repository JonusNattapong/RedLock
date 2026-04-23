/**
 * LEVEL 04 - BROKEN ACCESS CONTROL
 * ความยาก: ★★★★☆☆☆☆☆☆
 *
 * จุดอ่อน: ไม่มีการตรวจสอบสิทธิ์ก่อนเข้าถึงข้อมูลผู้ใช้คนอื่น
 * กลไกการป้องกัน: ตรวจสอบ ownership ทุกครั้งก่อนส่งคืนข้อมูล
 * วิธีผ่าน: แก้ไข id ใน URL เพื่อเข้าถึงข้อมูลผู้ใช้อื่น
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level04.js
 * 🚀 Port: 8104
 */

const express = require("express");
const router = express.Router();

const users = [
  { id: 1, username: "normal_user", email: "user@lab.local", balance: 1500 },
  { id: 2, username: "john_doe", email: "john@lab.local", balance: 3200 },
  {
    id: 3,
    username: "admin_account",
    email: "admin@lab.local",
    balance: 999999,
    secret_flag: "FLAG{broken_access_control_04_done}",
  },
];

router.get("/profile/:id", (req, res) => {
  const userId = parseInt(req.params.id);

  // ❌ จุดอ่อน: ไม่มีการตรวจสอบว่าเป็นเจ้าของข้อมูลจริงหรือไม่
  const user = users.find((u) => u.id === userId);

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 04 - Broken Access Control</title></head>
    <body style="max-width: 600px; margin: 50px auto; font-family: monospace;">
        <h1>🔐 LEVEL 04</h1>
        <h3>Broken Access Control</h3>
        <hr>
        <p>เข้าสู่ระบบในฐานะผู้ใช้ id=1 แต่หาข้อมูลแอดมิน id=3</p>
        <p>ข้อมูลของคุณ: <a href="/profile/1">/profile/1</a></p>
        
        <div id="result"></div>
        
        <script>
            fetch('/profile/1').then(r=>r.json()).then(d=>{
                document.getElementById('result').innerText = 'ข้อมูลผู้ใช้ปัจจุบัน: ' + JSON.stringify(d, null, 2);
            });
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

  const PORT = 8104;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("🔐 LEVEL 04 - Broken Access Control");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: แก้ไข id ใน URL /profile/1 เป็นเลขอื่น`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 4,
    port: 8104,
    name: "Broken Access Control",
    vulnerability: "Missing object ownership verification",
    difficulty: 4,
    exploit_hint:
      "เว็บไซต์มักลืมตรวจสอบว่าคุณคือเจ้าของข้อมูลจริงๆ หรือแค่รู้ id",
    mitigation: "ตรวจสอบสิทธิ์และความเป็นเจ้าของข้อมูลทุกครั้งก่อนส่งคืน",
    solution: "เข้าไปที่ URL /profile/3 โดยตรง",
  },
};
