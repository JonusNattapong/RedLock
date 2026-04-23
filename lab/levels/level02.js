/**
 * LEVEL 02 - SIMPLE SQL INJECTION
 * ความยาก: ★★☆☆☆☆☆☆☆☆
 *
 * จุดอ่อน: สร้าง SQL Query โดยการต่อสตริงโดยตรงโดยไม่ sanitize input
 * กลไกการป้องกัน: ใช้ Prepared Statements / Parameterized Queries
 * วิธีผ่าน: ใส่ ' OR '1'='1 ในช่องค้นหา
 */

const express = require("express");
const router = express.Router();

// จำลองฐานข้อมูลผู้ใช้
const users = [
  { id: 1, username: "user01", email: "user01@lab.local", isAdmin: 0 },
  { id: 2, username: "user02", email: "user02@lab.local", isAdmin: 0 },
  {
    id: 3,
    username: "admin",
    email: "admin@lab.local",
    secret_flag: "FLAG{sql_injection_basic_done}",
    isAdmin: 1,
  },
];

router.post("/search", (req, res) => {
  const { query } = req.body;

  // ❌ จุดอ่อน: ต่อสตริง SQL โดยตรง ไม่มีการตรวจสอบ
  let results = users.filter((user) => {
    try {
      // จำลองพฤติกรรมของ SQL Injection
      return eval(`user.username.includes('${query}')`);
    } catch (e) {
      return false;
    }
  });

  res.json({
    count: results.length,
    users: results,
  });
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 02 - SQL Injection</title></head>
    <body style="max-width: 600px; margin: 50px auto; font-family: monospace;">
        <h1>💉 LEVEL 02</h1>
        <h3>Simple SQL Injection</h3>
        <hr>
        <p>ค้นหาผู้ใช้ และแสดงข้อมูลแอดมิน</p>
        <form id="searchForm">
            <input type="text" id="query" placeholder="ค้นหาชื่อผู้ใช้" style="width: 100%; padding: 10px; margin: 10px 0;">
            <button type="submit" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer;">ค้นหา</button>
        </form>
        <div id="results"></div>
        
        <script>
            document.getElementById('searchForm').onsubmit = (e) => {
                e.preventDefault();
                fetch('/level/02/search', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({query: document.getElementById('query').value})
                }).then(r=>r.json()).then(d=>{
                    let html = '<h4>ผลการค้นหา: '+d.count+' รายการ</h4><ul>';
                    d.users.forEach(u => {
                        html += '<li>'+JSON.stringify(u)+'</li>';
                    });
                    html += '</ul>';
                    document.getElementById('results').innerHTML = html;
                });
            }
        </script>
    </body>
    </html>
    `);
});

module.exports = {
  router,
  info: {
    level: 2,
    name: "Simple SQL Injection",
    vulnerability: "String Concatenation in SQL Query",
    difficulty: 2,
    exploit_hint: "ลองใช้อักขระพิเศษ ' OR เพื่อข้ามเงื่อนไข",
    mitigation: "ใช้ Prepared Statements, ORM, หรือ escape input ทุกครั้ง",
    solution: "ใส่ค่า: ') || true // ในช่องค้นหา",
  },
};
