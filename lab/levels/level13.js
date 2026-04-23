/**
 * Level 13: Insecure Deserialization
 * ช่องโหว่สุดยอดสายเก๋า Deserialization ของ Object ที่ไม่น่าเชื่อถือ
 */

const express = require("express");
const router = express.Router();

const FLAG = "MIBU{UN54F3_D353R14L1Z4710N_1S_F4T4L_2026}";

// ❌ ช่องโหว่: ใช้ eval() เพื่อ Deserialize ข้อมูล (จำลองพฤติกรรมของ unserialize() ใน PHP / Python Pickle)
function unsafeDeserialize(serializedData) {
  try {
    // จำลองการ Deserialize ที่ไม่ปลอดภัย
    return eval("(" + serializedData + ")");
  } catch (e) {
    return { error: e.message };
  }
}

router.get("/", (req, res) => {
  const sampleUser = {
    username: "test_user",
    email: "test@example.com",
    bio: "สวัสดีครับ ผมเป็นผู้ใช้ทดสอบ"
  };

  // Serialize ตัวอย่าง
  const sampleSerialized = JSON.stringify(sampleUser);

  res.send(`
    <html>
    <head>
        <title>Level 13: Insecure Deserialization</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
            .form-group { margin: 20px 0; }
            textarea { width: 100%; height: 120px; padding: 10px; margin: 10px 0; font-family: monospace; }
            button { padding: 12px 24px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .danger { background: #ffebee; padding: 15px; border-radius: 6px; color: #c62828; }
        </style>
    </head>
    <body>
        <h1>☠️ Level 13: Insecure Deserialization</h1>
        
        <div class="danger">
            <strong>⚠️ WARNING:</strong> นี่คือช่องโหว่อันตรายที่สุดในโลก เว็บไซต์ 90% ที่โดนแฮ็กใช้ช่องโหว่นี้ครับ
        </div>
        
        <p>ระบบนี้รับข้อมูลที่ถูก Serialize แล้วมา Deserialize แสดงผลเป็นข้อมูลผู้ใช้</p>
        
        <h3>ตัวอย่าง Serialized Data:</h3>
        <textarea readonly>${sampleSerialized}</textarea>
        
        <form method="POST" action="/level/13/process">
            <div class="form-group">
                <label>ใส่ Serialized Object ที่นี่:</label>
                <textarea name="data" placeholder='{"username":"test","email":"test@test.com"}'></textarea>
            </div>
            <button type="submit">Deserialize & แสดงผล</button>
        </form>
        
        <hr>
        <p><strong>Hint:</strong> ใน JavaScript eval() สามารถรันโค้ดได้โดยตรง ลองส่ง Object ที่มีฟังก์ชันที่รันอัตโนมัติ หรือส่งคำสั่ง RCE</p>
        <p><a href="/">← กลับหน้าหลัก</a></p>
    </body>
    </html>
  `);
});

router.post("/process", (req, res) => {
  const { data } = req.body;

  let result = "";
  let output = "";

  try {
    // ❌ ช่องโหว่: Deserialize ข้อมูลจากผู้ใช้โดยไม่มีการตรวจสอบใดๆ
    const userObj = unsafeDeserialize(data);

    if (userObj.getFlag === true || (userObj.constructor && userObj.constructor.name === "Function")) {
      output = `<div style="background: #c8e6c9; padding: 15px; border-radius: 6px;">
        <h3>✅ ยินดีด้วย คุณทำได้แล้ว!</h3>
        <p><strong>FLAG:</strong> ${FLAG}</p>
      </div>`;
    } else {
      output = `<div style="background: #e3f2fd; padding: 15px; border-radius: 6px;">
        <h3>ผลการ Deserialize:</h3>
        <pre>${JSON.stringify(userObj, null, 2)}</pre>
      </div>`;
    }

  } catch (e) {
    output = `<div style="background: #ffebee; padding: 15px; border-radius: 6px; color: #c62828;">❌ เกิดข้อผิดพลาด: ${e.message}</div>`;
  }

  res.send(`
    <html>
    <head>
        <title>Level 13: Result</title>
        <style>
            body { max-width: 700px; margin: 40px auto; font-family: 'Segoe UI', sans-serif; padding: 0 20px; }
        </style>
    </head>
    <body>
        <h1>☠️ Level 13: Insecure Deserialization</h1>
        ${output}
        <hr>
        <p><a href="/level/13">← ลองอีกครั้ง</a></p>
    </body>
    </html>
  `);
});

module.exports = {
  router,
  info: {
    level: 13,
    name: "Insecure Deserialization",
    difficulty: 10,
    vulnerability: "ระบบทำการ Deserialize ข้อมูลที่ผู้ใช้ส่งมาโดยไม่มีการตรวจสอบ ทำให้สามารถ Injection Payload เพื่อสั่งรันโค้ดบน Server (RCE) ได้โดยตรง",
    exploit_hint: "ลองส่ง Payload ที่เมื่อ eval() ทำงาน จะมีการเรียกใช้ฟังก์ชัน หรือส่ง Object ที่มี property getFlag: true",
    mitigation: "ไม่เคย Deserialize ข้อมูลจากผู้ใช้เลย ถ้าจำเป็นต้องใช้ ให้ใช้ Data-Only Format อย่าง JSON เท่านั้น และใช้ Schema Validation ก่อน Deserialize",
    solution: "ส่ง Payload: {\"getFlag\": true} หรือใช้ Payload RCE แบบ IIFE เช่น (()=>{return {getFlag:true}})() ลงในฟอร์ม ระบบจะคืนค่า FLAG ให้"
  }
};
