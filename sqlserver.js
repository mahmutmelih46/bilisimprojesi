const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '1234',     
    database: 'cs2skinmarket' 
});

db.connect(err => {
    if (err) {
        console.error('HATA: MySQL veritabanına bağlanılamadı!', err);
        return;
    }
    console.log('BAŞARILI: MySQL veritabanına bağlandı!');
});


app.get('/api/products', (req, res) => {
    const sql = "SELECT * FROM products"; 
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Veri çekme hatası:", err);
            return res.status(500).json(err);
        }
        return res.json(data); 
    });
});


app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM products WHERE id = ? LIMIT 1";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Tek ürün çekme hatası:', err);
            return res.status(500).json(err);
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı' });
        }
        return res.json(results[0]);
    });
});

app.listen(3000, () => {
    console.log("Sunucu çalışıyor: http://localhost:3001 adresine gidebilirsin.");
});