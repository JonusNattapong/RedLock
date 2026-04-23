/**
 * LEVEL 03 - BASIC CROSS SITE SCRIPTING (XSS)
 * ความยาก: ★★★☆☆☆☆☆☆☆
 *
 * จุดอ่อน: แสดงข้อความที่ผู้ใช้ป้อนโดยไม่ทำ HTML Escape
 * กลไกการป้องกัน: Escape HTML ทุกข้อความก่อนแสดงผล, ใช้ CSP Header
 * วิธีผ่าน: ใส่แท็ก <script> หรือ <img> พร้อม javascript ในช่องแสดงความคิดเห็น
 */

const express = require("express");
const router = express.Router();

let comments = [
  { id: 1, author: "System", text: "ยินดีต้อนรับสู่ระบบแสดงความคิดเห็น" },
];

router.get("/comments", (req, res) => {
  res.json(comments);
});

router.post("/comment", (req, res) => {
  const { text } = req.body;

  // ❌ จุดอ่อน: ไม่ escape HTML เลย เก็บลงฐานข้อมูลตรงๆ
  comments.push({
    id: comments.length + 1,
    author: "Guest",
    text: text,
  });

  res.json({ success: true });
});

router.get("/", (req, res) => {
  res.send(`
    <html>
    <head><title>Level 03 - XSS Basic</title></head>
    <body style="max-width: 700px; margin: 50px auto; font-family: monospace;">
        <h1>📝 LEVEL 03</h1>
        <h3>Basic Cross Site Scripting (XSS)</h3>
        <hr>
        <p>ทำการโจมตี XSS ให้แสดง alert() บนหน้านี้</p>
        
        <form id="commentForm">
            <textarea id="comment" placeholder="แสดงความคิดเห็นของคุณ" style="width: 100%; height: 80px; padding: 10px; margin: 10px 0;"></textarea>
            <button type="submit" style="padding: 10px 20px; background: #FF9800; color: white; border: none; cursor: pointer;">ส่งความคิดเห็น</button>
        </form>
        
        <h4>ความคิดเห็นล่าสุด:</h4>
        <div id="commentList" style="background: #f5f5f5; padding: 15px; border-radius: 4px;"></div>
        
        <script>
            function loadComments() {
                fetch('/level/03/comments').then(r=>r.json()).then(c=>{
                    let html = '';
                    c.forEach(cm => {
                        // ❌ จุดอ่อน: ใช้ innerHTML โดยไม่ escape
                        html += '<div style="border-bottom: 1px solid #ddd; padding: 8px 0;">' + cm.text + '</div>';
                    });
                    document.getElementById('commentList').innerHTML = html;
                });
            }
            
            document.getElementById('commentForm').onsubmit = (e) => {
                e.preventDefault();
                fetch('/level/03/comment', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({text: document.getElementById('comment').value})
                }).then(()=>{
                    loadComments();
                    document.getElementById('comment').value = '';
                });
            };
            
            loadComments();
        </script>
    </body>
    </html>
    `);
});

module.exports = {
  router,
  info: {
    level: 3,
    name: "Basic Cross Site Scripting",
    vulnerability: "Missing HTML Output Encoding",
    difficulty: 3,
    exploit_hint: "ลองใส่แท็ก HTML ที่มี javascript อยู่ข้างใน",
    mitigation:
      "Escape HTML ทุก output, ใช้ textContent แทน innerHTML, ติดตั้ง CSP Header",
    solution:
      "ใส่ค่า: <script>alert('XSS')</script> หรือ <img src=x onerror=alert(1)>",
  },
};
