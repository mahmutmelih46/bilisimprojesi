const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const mysql = require('mysql2'); 
const cors = require("cors");

const app = express();

// --- 1. AYARLAR ---
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// --- 2. VERİTABANI BAĞLANTISI ---
const db = mysql.createPool({
    host: '127.0.0.1', 
    user: 'root', 
    password: '1234',
    database: 'cs2skinmarket',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.query("SELECT 1", (err) => {
    if (err) console.error("❌ DB Hatası:", err.message);
    else console.log(`🟢 DB Bağlantısı Başarılı!`);
});

// --- 3. STEAM OTURUM AYARLARI ---
app.use(session({
    name: "steam.sid",
    secret: "supersecretkey",
    resave: true, 
    saveUninitialized: true, 
    cookie: { 
        secure: false, 
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: "http://localhost:3001/auth/steam/return",
    realm: "http://localhost:3001/",
    apiKey: "52DB7EED82A409BA87160A3B392FCBBC"
  },
  (identifier, profile, done) => done(null, profile)
));

// --- 4. ROUTES ---

// Favorileri Getir
app.get('/api/favorites', (req, res) => {
    if (!req.user) {
        console.log("⚠️ /api/favorites: Kullanıcı giriş yapmamış.");
        return res.json([]);
    }

    console.log(`🔍 Favoriler isteniyor: UserID ${req.user.id}`);

    const sql = "SELECT item_id FROM favorites WHERE user_id = ?";
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("❌ SQL Hatası:", err);
            return res.status(500).json([]);
        }
        
        const favIds = results.map(row => String(row.item_id)); 
        console.log("✅ Bulunan Favoriler:", favIds);
        res.json(favIds);
    });
});

// Favori Ekle/Çıkar
app.post('/api/favorites/toggle', (req, res) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Giriş yapmalısın!" });

    const { itemId } = req.body;
    const userId = req.user.id;

    console.log(`⚡ Toggle İsteği: User ${userId} -> Item ${itemId}`);

    db.query("SELECT * FROM favorites WHERE user_id = ? AND item_id = ?", [userId, itemId], (err, results) => {
        if (err) return res.status(500).json({ error: err });

        if (results.length > 0) {
            db.query("DELETE FROM favorites WHERE user_id = ? AND item_id = ?", [userId, itemId], () => {
                console.log("🗑️ Favori silindi");
                res.json({ success: true, action: 'removed' });
            });
        } else {
            db.query("INSERT INTO favorites (user_id, item_id) VALUES (?, ?)", [userId, itemId], () => {
                console.log("❤️ Favori eklendi");
                res.json({ success: true, action: 'added' });
            });
        }
    });
});

app.get('/api/products', (req, res) => {
    db.query("SELECT * FROM products", (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

app.post('/api/pay', (req, res) => {
    const { amount } = req.body;
    setTimeout(() => res.json({ success: true, message: `Ödeme Başarılı! ₺${amount} çekildi.` }), 1500);
});

app.get("/auth/steam", passport.authenticate("steam"));
app.get("/auth/steam/return", passport.authenticate("steam", { failureRedirect: "/" }), (req, res) => res.redirect("http://localhost:5173/"));
app.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json(null);
  res.json({ id: req.user.id, name: req.user.displayName, avatar: req.user.photos[2].value, balance: "1250.00" });
});
app.get("/logout", (req, res, next) => req.logout((err) => { if (err) return next(err); res.redirect("http://localhost:5173/"); }));

app.listen(3001, () => {
    console.log("✅ Server 3001 portunda hazır.");
});