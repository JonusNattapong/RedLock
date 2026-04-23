/**
 * LEVEL 06 - BLIND SQL INJECTION
 * ความยาก: ★★★★★★☆☆☆☆
 *
 * จุดอ่อน: SQL Injection ที่ไม่แสดงผลข้อมูลโดยตรง แต่แสดงแค่ผลสำเร็จ/ล้มเหลว
 * กลไกการป้องกัน: Prepared Statements, Input Validation
 * วิธีผ่าน: ใช้ boolean based injection เพื่อถามคำติบ่อยๆ ทีละตัวอักษร
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level06.js
 * 🚀 Port: 8106
 */

const express = require("express");
const router = express.Router();

const SECRET_FLAG = "FLAG{blind_sql_injection_06_master}";

router.get("/order/status", (req, res) => {
  const orderId = req.query.id;

  // ❌ จุดอ่อน: Blind SQL Injection Pattern (จำลอง)
  try {
    // จำลองพฤติกรรมระบบที่มี SQLi แต่ไม่แสดงข้อมูล
    const queryResult = eval(`
            // จำลองฐานข้อมูล
            const secret = "${SECRET_FLAG}";
            ${orderId}
        `);

    if (queryResult) {
      res.send("✅ Order exists and is valid");
    } else {
      res.send("❌ Order not found");
    }
  } catch (e) {
    res.send("❌ Database error");
  }
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 06 - Blind SQL Injection</title></head>
    <body style="max-width: 650px; margin: 50px auto; font-family: monospace;">
        <h1>👁️ LEVEL 06</h1>
        <h3>Blind SQL Injection</h3>
        <hr>
        <p>ระบบนี้ไม่แสดงผลข้อมูลเลย แค่แสดงว่ามีข้อมูลหรือไม่</p>
        <p>ค้นหา flag ที่ซ่อนอยู่ในระบบ</p>
        
        <h4>ตรวจสอบสถานะ Order:</h4>
        <form action="/order/status" method="GET">
            <input type="text" name="id" placeholder="Order ID" style="padding: 8px; width: 300px;">
            <button type="submit" style="padding: 8px 16px;">ตรวจสอบ</button>
        </form>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Hint:</strong> ลองส่งค่าแบบนี้: 1 AND (SELECT SUBSTR(flag,1,1) FROM secrets) = 'F'
        </div>
    </body>
    </html>
    `);
});

// ✅ Standalone Server สำหรับรันทีละไฟล์
if (require.main === module) {
  const app = express();
  app.use("/", router);

  const PORT = 8106;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("👁️ LEVEL 06 - Blind SQL Injection");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: ใช้ boolean injection ถามทีละตัวอักษร`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 6,
    port: 8106,
    name: "Blind SQL Injection",
    vulnerability: "Boolean based blind injection without output",
    difficulty: 6,
    exploit_hint:
      "ไม่ต้องการให้ระบบแสดงข้อมูล แค่ทราบว่าเงื่อนไขถูกหรือผิดก็พอแฮ็กได้",
    mitigation: "ใช้ Prepared Statements เสมอ ไม่เคยต่อสตริง SQL",
    solution: "ส่ง payload ที่เช็คทีละตัวอักษรจนกว่าจะได้ flag ครบ",
  },
};
