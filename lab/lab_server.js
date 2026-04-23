/**
 * MIBU-101 WEB SECURITY LAB SERVER
 * ระบบทดลองฝึกทักษะเจาะระบบเว็บ 10 เลเวล
 *
 * วิธีรัน: node lab/lab_server.js
 * เปิดเบราว์เซอร์ที่ http://localhost:8100
 */

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8100;

// โหลดทุกเลเวล
const levels = [
  require("./levels/level01"),
  require("./levels/level02"),
  require("./levels/level03"),
  require("./levels/level04"),
  require("./levels/level05"),
  require("./levels/level06"),
  require("./levels/level07"),
  require("./levels/level08"),
  require("./levels/level09"),
  require("./levels/level10"),
  require("./levels/level11"),
  require("./levels/level12"),
  require("./levels/level13"),
];

// Middleware
const cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// กำหนด route สำหรับแต่ละเลเวล
levels.forEach((level) => {
  app.use(`/level/${String(level.info.level).padStart(2, "0")}`, level.router);
});

// หน้าหลัก
app.get("/", (req, res) => {
  let levelListHtml = "";
  levels.forEach((level) => {
    const stars =
      "★".repeat(level.info.difficulty) +
      "☆".repeat(10 - level.info.difficulty);
    levelListHtml += `
        <div style="border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 6px;">
            <h3>Level ${level.info.level}: ${level.info.name}</h3>
            <div style="color: #ff9800;">${stars}</div>
            <p><strong>จุดอ่อน:</strong> ${level.info.vulnerability}</p>
            <p><a href="/level/${String(level.info.level).padStart(2, "0")}" style="color: #2196F3;">ไปที่เลเวล →</a></p>
        </div>
        `;
  });

  res.send(`
    <html>
    <head>
        <title>Mibu-101 Web Security Lab</title>
        <style>
            body { max-width: 900px; margin: 40px auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0 20px; }
            .header { text-align: center; border-bottom: 2px solid #2196F3; padding-bottom: 20px; margin-bottom: 30px; }
            .level-container { margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔰 MIBU-101 WEB SECURITY LAB</h1>
            <p>ระบบทดลองฝึกทักษะเจาะระบบเว็บ 13 เลเวล เรียงลำดับความยาก</p>
            <p>สำหรับการศึกษาเท่านั้น ห้ามนำไปใช้ในระบบที่ไม่ได้รับอนุญาต</p>
        </div>

        <h2>📋 รายการเลเวลทดลอง</h2>
        <div class="level-container">
            ${levelListHtml}
        </div>

        <hr>
        <footer style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
            Mibu-101 Security Laboratory | สำหรับวัตถุประสงค์การศึกษาเท่านั้น
        </footer>
    </body>
    </html>
    `);
});

// หน้าแสดงรายละเอียดจุดอ่อนและวิธีแก้ไข
app.get("/guide", (req, res) => {
  let guideHtml = "";
  levels.forEach((level) => {
    guideHtml += `
        <div style="border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 6px;">
            <h3>Level ${level.info.level}: ${level.info.name}</h3>
            <hr>
            <p><strong>📌 จุดอ่อน:</strong> ${level.info.vulnerability}</p>
            <p><strong>💡 Hint:</strong> ${level.info.exploit_hint}</p>
            <p><strong>✅ วิธีป้องกัน:</strong> ${level.info.mitigation}</p>
            <details>
                <summary>🔓 ดูวิธีผ่านเลเวลนี้</summary>
                <p style="background: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    <strong>Solution:</strong> ${level.info.solution}
                </p>
            </details>
        </div>
        `;
  });

  res.send(`
    <html>
    <head>
        <title>Lab Guide - Mibu-101</title>
        <style>
            body { max-width: 900px; margin: 40px auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0 20px; }
            details { cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>📖 Mibu-101 Lab Guide</h1>
        <p>คู่มือการผ่านแต่ละเลเวล รวมถึงจุดอ่อน วิธีโจมตี และกลไกการป้องกัน</p>
        <hr>
        ${guideHtml}
        <p style="text-align: center; margin-top: 40px;"><a href="/">← กลับหน้าหลัก</a></p>
    </body>
    </html>
    `);
});

// เริ่ม Server
app.listen(PORT, () => {
  console.log("\n=========================================");
  console.log("🔰 MIBU-101 WEB SECURITY LAB");
  console.log("=========================================");
  console.log(`✅ Server รันอยู่ที่: http://localhost:${PORT}`);
  console.log(`📖 คู่มือ: http://localhost:${PORT}/guide`);
  console.log("\n⚠️  ใช้สำหรับการศึกษาเท่านั้น!");
  console.log("=========================================\n");
});
