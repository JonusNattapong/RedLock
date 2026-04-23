/**
 * Level 12: Broken JWT Authentication
 * ช่องโหว่ JWT: อนุญาตใช้ Algorithm 'none' และใช้ Secret ที่อ่อนแอ
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const FLAG = "MIBU{JW7_N0N3_4LG0R17HM_15_D34DLY}";
const JWT_SECRET = "mibu123"; // Secret ที่อ่อนแอมาก สามารถแคร็กได้ง่ายด้วย Wordlist

// User Database
const users = {
  guest: { id: 1, username: "guest", role: "guest" },
  admin: { id: 2, username: "admin", role: "admin", flag: FLAG }
};

router.get("/", (req, res) => {
  // ให้ Token แก่ Guest ทันที
  const guestToken = jwt.sign({ username: "guest", role: "guest" }, JWT_SECRET, { algorithm: "HS256" });

  res.cookie("auth_token", guestToken);

  res.send(`
    <html>
    <head>
        <title>Level 12: Broken JWT</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
            .token-box { background: #f5f5f5; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; }
        </style>
    </head>
    <body>
        <h1>🔐 Level 12: Broken JWT Authentication</h1>
        <p>ยินดีต้อนรับ Guest! <strong>Admin เท่านั้นที่เห็น FLAG</strong></p>
        
        <h3>Token ปัจจุบันของคุณ:</h3>
        <div class="token-box">${guestToken}</div>
        
        <hr>
        <p><a href="/level/12/profile">ไปที่หน้า Profile</a></p>
        <p><strong>Hint:</strong> JWT มีช่องโหว่ 2 ประเภท: Algorithm 'none' และ Weak Secret ลองแก้ไข Payload ใน JWT ดูนะครับ</p>
        <p><a href="/">← กลับหน้าหลัก</a></p>
    </body>
    </html>
  `);
});

router.get("/profile", (req, res) => {
  const token = req.cookies.auth_token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.redirect("/level/12");
  }

  let userData = null;
  let error = null;

  try {
    // ❌ ช่องโหว่: อนุญาตใช้ Algorithm 'none' และไม่ตรวจสอบ Signature เมื่อใช้ none
    const decoded = jwt.verify(token, JWT_SECRET, { 
      algorithms: ["HS256", "none"], // ❌ ช่องโหว่ที่แรก: อนุญาต none algorithm
      ignoreExpiration: true 
    });

    userData = users[decoded.username];

  } catch (e) {
    error = e.message;
  }

  let profileContent = "";

  if (error) {
    profileContent = `<div style="background: #ffebee; padding: 15px; border-radius: 6px; color: #c62828;">❌ Token ไม่ถูกต้อง: ${error}</div>`;
  } else if (userData) {
    profileContent = `
      <div style="background: #e3f2fd; padding: 15px; border-radius: 6px;">
        <h3>ข้อมูลผู้ใช้</h3>
        <p><strong>Username:</strong> ${userData.username}</p>
        <p><strong>Role:</strong> ${userData.role}</p>
        ${userData.role === "admin" ? `<p style="background: #c8e6c9; padding: 10px; border-radius: 4px;"><strong>✅ FLAG:</strong> ${userData.flag}</p>` : ""}
      </div>
    `;
  }

  res.send(`
    <html>
    <head>
        <title>Level 12: Profile</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
        </style>
    </head>
    <body>
        <h1>🔐 Level 12: Profile Page</h1>
        ${profileContent}
        <hr>
        <p><a href="/level/12">← กลับ</a></p>
    </body>
    </html>
  `);
});

module.exports = {
  router,
  info: {
    level: 12,
    name: "Broken JWT Authentication",
    difficulty: 8,
    vulnerability: "ระบบยืนยันตัวตนด้วย JWT มีช่องโหว่ 2 แบบ: อนุญาตใช้ Algorithm 'none' และใช้ Secret ที่อ่อนแอ ทำให้สามารถปลอมแปลง Token เป็น Admin ได้",
    exploit_hint: "แก้ไข Payload ของ JWT เป็น username: admin แล้วเปลี่ยน Algorithm เป็น 'none' หรือแคร็ก Secret 'mibu123' ด้วย Brute Force",
    mitigation: "ไม่อนุญาต Algorithm 'none' เลยทีเดียว, ใช้ Secret ที่แข็งแรง (random 32+ bytes), ระบุ Algorithm ชัดเจน, ตรวจสอบทุก Claims",
    solution: "1) แก้ Payload JWT ให้ username เป็น 'admin' แล้วลบ Signature ออก แล้วส่ง Token กลับไป / 2) หรือใช้ John / Hashcat แคร็ก JWT ด้วย wordlist พบว่า Secret คือ 'mibu123' แล้วสร้าง Token ใหม่"
  }
};
