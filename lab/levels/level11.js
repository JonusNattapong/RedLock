/**
 * Level 11: SSRF (Server-Side Request Forgery)
 * หน้าเว็บที่รับ URL ไปดึงรูปภาพ ไม่มีการตรวจสอบ IP ภายใน
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");

const FLAG = "MIBU{55RF_15_N0T_4_J0K3_1NT3RN4L_4CC355}";

// จำลอง Internal Service ที่มีเฉพาะภายในเซิร์ฟเวอร์
const internalServices = {
  "http://127.0.0.1/server-status": "Apache Server Status - Uptime: 14 days",
  "http://169.254.169.254/latest/meta-data/": `instance-id: i-0abcdef1234567890\nsecret-key: AKIAIOSFODNN7EXAMPLE\nflag: ${FLAG}`,
  "http://localhost/admin/secret": FLAG,
  "http://0.0.0.0/internal/config": `database_password: Mibu1234Secure\nadmin_token: ${FLAG}`,
};

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
        <title>Level 11: SSRF</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
            .form-group { margin: 20px 0; }
            input { width: 100%; padding: 10px; margin: 10px 0; }
            button { padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>🔍 Level 11: Server-Side Request Forgery</h1>
        <p style="color: #666;">ระบบนี้ให้คุณป้อน URL รูปภาพ เพื่อแสดงรูปภาพบนหน้าเว็บ</p>
        
        <form method="POST" action="/level/11/fetch">
            <div class="form-group">
                <label>URL รูปภาพ:</label>
                <input type="text" name="image_url" placeholder="https://example.com/image.jpg" required>
            </div>
            <button type="submit">ดึงรูปภาพ</button>
        </form>
        
        <hr>
        <p><strong>Hint:</strong> ลองส่ง URL ที่ไม่ใช่รูปภาพดูนะครับ เช่น http://localhost/...</p>
        <p><a href="/">← กลับหน้าหลัก</a></p>
    </body>
    </html>
  `);
});

router.post("/fetch", async (req, res) => {
  const { image_url } = req.body;
  
  let result = "";
  
  // ❌ ช่องโหว่: ไม่มีการตรวจสอบ IP, ไม่มี Whitelist Domain, ไม่บล็อก Private IP
  try {
    // ตรวจสอบว่าเป็น Internal URL หรือไม่
    if (internalServices[image_url]) {
      result = `<pre>${internalServices[image_url]}</pre>`;
    } else {
      // จำลองการดึงข้อมูลจากภายนอก
      const response = await axios.get(image_url, { timeout: 3000 });
      result = `<div style="background: #f0f0f0; padding: 15px; border-radius: 6px;">
        <p>✅ ดึงข้อมูลสำเร็จ</p>
        <pre>${response.data.toString().substring(0, 500)}</pre>
      </div>`;
    }
  } catch (e) {
    result = `<div style="background: #ffebee; padding: 15px; border-radius: 6px; color: #c62828;">
      ❌ เกิดข้อผิดพลาด: ${e.message}
    </div>`;
  }

  res.send(`
    <html>
    <head>
        <title>Level 11: SSRF</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
        </style>
    </head>
    <body>
        <h1>🔍 Level 11: Server-Side Request Forgery</h1>
        <h3>ผลลัพธ์:</h3>
        ${result}
        <hr>
        <p><a href="/level/11">← ลองอีกครั้ง</a></p>
    </body>
    </html>
  `);
});

module.exports = {
  router,
  info: {
    level: 11,
    name: "Server-Side Request Forgery (SSRF)",
    difficulty: 7,
    vulnerability: "ระบบอนุญาตให้ Server ทำ HTTP Request ไปยัง URL ที่ผู้ใช้ระบุ โดยไม่มีการตรวจสอบ หมายถึงเราสามารถสั่ง Server ไปดึงข้อมูลจาก Internal Network / Cloud Metadata ได้",
    exploit_hint: "ลองส่ง URL แบบ Internal เช่น http://127.0.0.1/admin/secret หรือ http://169.254.169.254/latest/meta-data/",
    mitigation: "ใช้ Domain Whitelist, Block Private IP Ranges, ปิดการเข้าถึง Metadata Service จาก Application, ใช้ Network Segmentation",
    solution: "ส่งค่า http://localhost/admin/secret หรือ http://169.254.169.254/latest/meta-data/ ลงในฟอร์ม ระบบจะคืนค่า FLAG กลับมา"
  }
};
