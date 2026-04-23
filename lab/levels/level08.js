/**
 * LEVEL 08 - SECOND ORDER SQL INJECTION
 * ความยาก: ★★★★★★★★☆☆
 *
 * จุดอ่อน: ข้อมูลที่ inject ไม่ทำงานทันที แต่ถูกเก็บไว้ใน "ฐานข้อมูล" ก่อน
 *          แล้วค่อย execute ในภายหลังเมื่อถูกนำไปใช้ต่อในอีก query หนึ่ง
 * กลไกการป้องกัน: Input ตอน register ถูก sanitize แล้ว แต่ตอนใช้งานไม่ได้ sanitize
 * วิธีผ่าน: สมัคร username ที่มี payload แฝงอยู่ แล้ว trigger ด้วยการเปลี่ยน password
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level08.js
 * 🚀 Port: 8108
 */

const express = require("express");
const router = express.Router();

const SECRET_FLAG = "FLAG{second_order_sql_08_delayed_pwn}";

// จำลอง "ฐานข้อมูล" ใน memory
const db = {
  users: [
    { id: 1, username: "admin", password: "s3cr3tAdminPass", role: "admin" },
    { id: 2, username: "alice", password: "alice123", role: "user" },
  ],
  nextId: 3,
};

// Session จำลอง (ใช้ query param แทน cookie เพื่อความง่าย)
// ?session=username

// ──────────────────────────────────────────────
// REGISTER  (มีการ sanitize input — ปลอดภัยดูเหมือน)
// ──────────────────────────────────────────────
router.post("/register", express.urlencoded({ extended: false }), (req, res) => {
  const username = req.body.username || "";
  const password = req.body.password || "";

  if (!username || !password) {
    return res.redirect("/?msg=error_empty");
  }

  // ✅ ดูเหมือนปลอดภัย: escape single quote ก่อนเก็บ
  const safeUsername = username.replace(/'/g, "''");

  // ตรวจ duplicate
  const exists = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    return res.redirect("/?msg=error_duplicate");
  }

  db.users.push({
    id: db.nextId++,
    username: safeUsername,   // เก็บค่า escaped ลงใน DB
    password,
    role: "user",
  });

  res.redirect(`/?msg=registered&session=${encodeURIComponent(safeUsername)}`);
});

// ──────────────────────────────────────────────
// CHANGE PASSWORD  (❌ จุดอ่อน: ดึง username จาก DB แล้วนำไปต่อ string โดยไม่ escape อีกครั้ง)
// ──────────────────────────────────────────────
router.post("/change-password", express.urlencoded({ extended: false }), (req, res) => {
  const session = req.body.session || req.query.session || "";
  const newPassword = req.body.newPassword || "";

  if (!session || !newPassword) {
    return res.redirect(`/?msg=error_empty&session=${encodeURIComponent(session)}`);
  }

  // ดึง user จาก "DB" ด้วย session (username)
  const currentUser = db.users.find((u) => u.username === session);
  if (!currentUser) {
    return res.redirect("/?msg=error_session");
  }

  // ❌ จุดอ่อน: นำ username จาก DB (ที่ถูก un-escape แล้วตอนดึงออกมา) ไปต่อใน "query" โดยตรง
  // ในระบบจริง: UPDATE users SET password='...' WHERE username='<username_from_db>'
  // username_from_db อาจมี SQL payload แฝงอยู่แล้ว!
  const fakeQuery = `UPDATE users SET password='${newPassword}' WHERE username='${currentUser.username}'`;

  // จำลองการ execute query (eval เพื่อสาธิต)
  try {
    // parse และ execute query จำลอง
    const result = eval(`
      (function(){
        const secret = "${SECRET_FLAG}";
        // จำลอง: ถ้า query มี OR '1'='1 จะ update ทุก user (รวม admin)
        const query = \`${fakeQuery}\`;

        // ตรวจหา injection pattern: ' OR / ' or  / '--
        if (/['"]\\s*(or|OR)\\s*['"]?\\s*[\\w'"]/.test(query) || query.includes("--")) {
          // payload สำเร็จ! แสดง flag
          return { success: true, flag: secret, affected: "ALL USERS (including admin!)" };
        }

        // normal update
        const user = db.users.find(u => u.username === session);
        if (user) user.password = newPassword;
        return { success: true, affected: session };
      })()
    `);

    if (result.flag) {
      return res.send(`
        <html><body style="max-width:650px;margin:50px auto;font-family:monospace;">
          <h2>⚠️ SQL Injection Detected in Query!</h2>
          <pre style="background:#1e1e1e;color:#4ec9b0;padding:20px;border-radius:6px;">
Query executed:
${fakeQuery}

💥 Injection triggered!
Affected: ${result.affected}
          </pre>
          <div style="background:#d4edda;padding:20px;border-radius:6px;font-size:1.2em;">
            🎉 <strong>${result.flag}</strong>
          </div>
          <br><a href="/">← กลับหน้าหลัก</a>
        </body></html>
      `);
    }

    res.redirect(`/?msg=password_changed&session=${encodeURIComponent(session)}`);
  } catch (e) {
    res.redirect(`/?msg=error_db&session=${encodeURIComponent(session)}`);
  }
});

// ──────────────────────────────────────────────
// MAIN PAGE
// ──────────────────────────────────────────────
router.get("/", (req, res) => {
  const msg = req.query.msg || "";
  const session = req.query.session || "";

  const msgBox = {
    registered: `<div style="background:#d4edda;padding:10px;border-radius:4px;">✅ สมัครสำเร็จ! คุณ login แล้วในฐานะ <strong>${session}</strong></div>`,
    password_changed: `<div style="background:#d4edda;padding:10px;border-radius:4px;">✅ เปลี่ยน password สำเร็จ</div>`,
    error_empty: `<div style="background:#f8d7da;padding:10px;border-radius:4px;">❌ กรุณากรอกข้อมูลให้ครบ</div>`,
    error_duplicate: `<div style="background:#f8d7da;padding:10px;border-radius:4px;">❌ Username นี้มีอยู่แล้ว</div>`,
    error_session: `<div style="background:#f8d7da;padding:10px;border-radius:4px;">❌ Session ไม่ถูกต้อง กรุณา login ใหม่</div>`,
    error_db: `<div style="background:#f8d7da;padding:10px;border-radius:4px;">❌ Database error</div>`,
  }[msg] || "";

  const userListHtml = db.users
    .map(
      (u) =>
        `<tr><td>${u.id}</td><td>${u.username}</td><td>${"*".repeat(u.password.length)}</td><td>${u.role}</td></tr>`
    )
    .join("");

  res.send(`
    <html>
    <head><title>Level 08 - Second Order SQL Injection</title></head>
    <body style="max-width:650px;margin:50px auto;font-family:monospace;">
      <h1>🕰️ LEVEL 08</h1>
      <h3>Second Order SQL Injection</h3>
      <hr>
      <p>ระบบนี้มีการ sanitize input ตอน register <strong>แล้ว</strong></p>
      <p>แต่ตอนเปลี่ยน password มีการนำ username จาก DB ไปใช้ต่อโดยไม่ระวัง...</p>

      ${msgBox}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;">

        <div>
          <h4>📝 สมัครสมาชิก</h4>
          <form action="/register" method="POST">
            <input name="username" placeholder="Username" style="padding:8px;width:100%;box-sizing:border-box;margin-bottom:8px;"><br>
            <input name="password" type="password" placeholder="Password" style="padding:8px;width:100%;box-sizing:border-box;margin-bottom:8px;"><br>
            <button type="submit" style="padding:8px 16px;width:100%;">สมัคร</button>
          </form>
        </div>

        <div>
          <h4>🔑 เปลี่ยน Password</h4>
          <form action="/change-password" method="POST">
            <input name="session" placeholder="Username (session)" value="${session}" style="padding:8px;width:100%;box-sizing:border-box;margin-bottom:8px;"><br>
            <input name="newPassword" type="password" placeholder="New Password" style="padding:8px;width:100%;box-sizing:border-box;margin-bottom:8px;"><br>
            <button type="submit" style="padding:8px 16px;width:100%;">เปลี่ยน Password</button>
          </form>
        </div>

      </div>

      <h4>👥 Users ในระบบ (จำลอง)</h4>
      <table border="1" style="width:100%;border-collapse:collapse;font-size:0.85em;">
        <tr style="background:#eee;"><th>ID</th><th>Username</th><th>Password</th><th>Role</th></tr>
        ${userListHtml}
      </table>

      <div style="background:#fff3cd;padding:15px;border-radius:4px;margin:20px 0;">
        <strong>Hint:</strong> Input ตอน register ถูก escape แล้ว... แต่ตอนเอา username ออกจาก DB ไปใช้ต่อล่ะ?<br><br>
        ลอง register ด้วย username: <code>admin'-- </code><br>
        แล้ว trigger ด้วยการเปลี่ยน password ดู
      </div>

      <details style="margin-top:10px;">
        <summary style="cursor:pointer;font-weight:bold;">💡 วิธีโจมตี Step by Step</summary>
        <ol style="line-height:2;">
          <li>Register ด้วย username = <code>admin'-- </code> (มี payload ฝังอยู่)</li>
          <li>ระบบ escape เป็น <code>admin''-- </code> แล้วเก็บลง DB</li>
          <li>ตอนดึงออกมา บาง DB จะ un-escape กลับเป็น <code>admin'-- </code></li>
          <li>นำไปต่อใน UPDATE query → <code>WHERE username='admin'--'</code></li>
          <li>-- comment ทำให้ conditions ที่เหลือถูกตัดออก → injection สำเร็จ!</li>
        </ol>
      </details>

    </body>
    </html>
  `);
});

// ✅ Standalone Server
if (require.main === module) {
  const app = express();
  app.use("/", router);

  const PORT = 8108;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("🕰️  LEVEL 08 - Second Order SQL Injection");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: Register ด้วย username ที่มี SQL payload`);
    console.log(`           แล้ว trigger ตอนเปลี่ยน password`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 8,
    port: 8108,
    name: "Second Order SQL Injection",
    vulnerability: "Stored/Second-order injection — payload เก็บก่อน execute ทีหลัง",
    difficulty: 8,
    exploit_hint:
      "register username = \"admin'-- \" แล้วกด change password เพื่อ trigger injection",
    mitigation:
      "Sanitize ทุกครั้งที่นำข้อมูลจาก DB ไปใช้ใน query ใหม่ ไม่ใช่แค่ตอนรับ input",
    solution:
      "ใช้ Prepared Statements ทุก query รวมถึง query ที่ใช้ข้อมูลจาก DB ด้วย",
  },
};