import React, { useState, useEffect, useMemo } from 'react';
import './App.css'; 

const API_BASE_URL = "http://localhost:3001";

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('knives-content'); 
  
  // Sepet (LocalStorage)
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('myCS2Cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  // --- ÖDEME MODALI STATE'LERİ ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // --- FİLTRELER ---
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedWears, setSelectedWears] = useState([]); 
  const [sortOrder, setSortOrder] = useState('default'); 
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [appliedWears, setAppliedWears] = useState([]);
  const [appliedSortOrder, setAppliedSortOrder] = useState('default');

  // --- FAVORİLER ---
  const [favorites, setFavorites] = useState([]);
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  // Sepet Kaydı
  useEffect(() => {
    localStorage.setItem('myCS2Cart', JSON.stringify(cart));
  }, [cart]);

  // KULLANICI VE FAVORİLERİ ÇEK (FIX: String Çevrimi Yapıldı)
  useEffect(() => {
    fetch(`${API_BASE_URL}/me`, { credentials: "include" })
      .then(res => res.status === 200 ? res.json() : null)
      .then(userData => {
        setUser(userData);
        if (userData) {
            fetch(`${API_BASE_URL}/api/favorites`, { credentials: "include" })
                .then(res => res.json())
                .then(favs => {
                    if(Array.isArray(favs)) setFavorites(favs.map(String));
                })
                .catch(err => console.error("Favori hatası:", err));
        }
      })
      .catch(() => setUser(null));
  }, []);

  // Ürünleri Çek
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(err => console.error("Hata:", err));
  }, []);

  // --- FAVORİLEME FONKSİYONU (FIX: Backend Bağlantısı) ---
  const toggleFavorite = (rawId) => {
    if (!user) {
        alert("Favorilere eklemek için önce giriş yapmalısın!");
        return;
    }
    const itemId = String(rawId); 

    
    const isFav = favorites.includes(itemId);
    setFavorites(prev => isFav ? prev.filter(id => id !== itemId) : [...prev, itemId]);

    // Backend isteği
    fetch(`${API_BASE_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
        credentials: 'include'
    }).catch(err => console.error(err));
  };

  // --- SEPET VE FİLTRE FONKSİYONLARI ---
  const getWearName = (floatVal) => {
      const f = parseFloat(floatVal);
      if (isNaN(f)) return "Bilinmiyor";
      if (f < 0.07) return "Fabrikadan Yeni Çıkmış";
      if (f < 0.15) return "Az Aşınmış";
      if (f < 0.38) return "Görevde Kullanılmış";
      if (f < 0.45) return "Eskimiş";
      return "Savaş Görmüş";
  };

// --- SEPETE EKLEME (MARKET OTOMATİK AÇILMAZ) ---
  const addToCart = (product) => {
    // Hem ID hem de İSİM kontrolü yapıyoruz
    const pId = String(product.id || product.item_id);
    
    const existingIndex = cart.findIndex(item => 
        String(item.id || item.item_id) === pId && item.name === product.name
    );
    
    if (existingIndex !== -1) {
        // Ürün zaten varsa miktarını arttır
        const updatedCart = [...cart];
        updatedCart[existingIndex].quantity = (updatedCart[existingIndex].quantity || 1) + 1;
        setCart(updatedCart);
    } else {
        // Ürün yoksa yeni ekle
        setCart([...cart, { ...product, quantity: 1 }]);
    }
    
    // setIsCartOpen(true);  <-- BU SATIRI SİLDİK, ARTIK OTOMATİK AÇILMAYACAK
  };

      // --- SEPETTEN AZALTMA (Mantıksal Silme) ---
  const decreaseFromCart = (index) => {
    const updatedCart = [...cart];
    
    // Eğer miktar 1'den büyükse, sadece sayıyı azalt
    if (updatedCart[index].quantity > 1) {
        updatedCart[index].quantity -= 1;
        setCart(updatedCart);
    } else {
        // Eğer miktar 1 ise, ürünü tamamen sil
        setCart(cart.filter((_, i) => i !== index));
    }
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);
  const handleWearChange = (e) => {
      const { value, checked } = e.target;
      if (checked) setSelectedWears([...selectedWears, value]);
      else setSelectedWears(selectedWears.filter(w => w !== value));
  };
  const applyFilters = () => {
      setAppliedMinPrice(minPrice);
      setAppliedMaxPrice(maxPrice);
      setAppliedWears(selectedWears);
      setAppliedSortOrder(sortOrder);
  };
  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.price) * (item.quantity || 1), 0);

  // --- FİLTRELEME MANTIĞI (FIX: String ID Kontrolü) ---
  const filteredProducts = useMemo(() => {
    return products
        .filter(item => {
            const id = String(item.item_id || item.db_id || item.id);
            if (showFavsOnly) return favorites.includes(id);
            if (!item.category) return false;
            return item.category.trim() === activeTab;
        })
        .filter(item => {
            const price = parseFloat(item.price);
            const min = appliedMinPrice === '' ? 0 : parseFloat(appliedMinPrice);
            const max = appliedMaxPrice === '' ? 9999999 : parseFloat(appliedMaxPrice);
            return price >= min && price <= max;
        })
        .filter(item => {
            if (appliedWears.length === 0) return true;
            const wearName = getWearName(item.float_val);
            return appliedWears.includes(wearName);
        })
        .sort((a, b) => {
            const pA = parseFloat(a.price);
            const pB = parseFloat(b.price);
            if (appliedSortOrder === 'fiyat-dusuk') return pA - pB;
            if (appliedSortOrder === 'fiyat-yuksek') return pB - pA;
            return 0;
        });
  }, [products, showFavsOnly, favorites, activeTab, appliedMinPrice, appliedMaxPrice, appliedWears, appliedSortOrder]);

  const handleCategoryChange = (tab) => {
      setActiveTab(tab);
      setShowFavsOnly(false);
  };

  // --- ÖDEME FONKSİYONLARI ---
  const handlePaymentInputChange = (e) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (cartTotal === 0) return alert("Sepet boş!");
    setPaymentLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/api/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...paymentForm, amount: cartTotal })
        });
        const result = await res.json();
        if (result.success) {
            alert("✅ " + result.message);
            clearCart();
            setPaymentForm({ cardNumber: '', expiry: '', cvv: '' });
            setIsPaymentModalOpen(false);
        } else {
            alert("Hata: " + result.message);
        }
    } catch { alert("Sunucu hatası!"); }
    finally { setPaymentLoading(false); }
  };

  return (
    <div className="app-container">
      {}
      <style>{`
        .container { margin: 0 !important; width: 100% !important; max-width: none !important; padding: 0 !important; flex: 1 !important; }
        .page-content-wrapper { display: flex !important; width: 95% !important; max-width: 1600px !important; margin: 20px auto !important; gap: 20px !important; }
        .filter-sidebar { flex-basis: 220px; flex-shrink: 0; background-color: #1c1c2b; padding: 15px; border-radius: 8px; }
        .item-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)) !important; gap: 15px !important; width: 100% !important; }
        
        .fiyat-kapsayici { display: flex !important; align-items: center !important; gap: 10px !important; width: 100% !important; height: 42px; margin-bottom: 10px; }
        .fiyat-kapsayici input { flex: 1 !important; width: auto !important; min-width: 0 !important; text-align: center !important; }

        .product-modal-overlay { position: fixed !important; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.4) !important; z-index: 99999 !important; display: flex !important; align-items: center; justify-content: center !important; backdrop-filter: blur(2px); }
        .product-modal { background-color: #1b1b2f !important; padding: 40px !important; border-radius: 15px !important; width: 1000px !important; max-width: 95% !important; position: relative !important; box-shadow: 0 20px 60px rgba(0,0,0,0.8) !important; border: 1px solid #333 !important; color: white !important; }
        .close-modal-btn { position: absolute !important; top: 15px; right: 20px; font-size: 30px; cursor: pointer; color: #aaa; }
        .modal-body { display: flex !important; gap: 40px !important; }
        .modal-left { flex: 1; display: flex; align-items: center; justify-content: center; }
        .modal-left img { width: 100%; max-height: 400px; object-fit: contain; }
        .modal-right { flex: 1; }
        .modal-right h2 { font-size: 28px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 12px 0; color: #ccc; font-size: 15px; }
        .modal-price-box { background: #252535; padding: 20px; border-radius: 10px; margin-top: 25px; text-align: right; }
        .price-text { font-size: 36px; font-weight: bold; color: white; display: block; margin: 10px 0; }

        .cart-sidebar {
            background-color: #1b1b2f !important;
            border-left: 1px solid #333;
            display: flex !important;
            flex-direction: column !important;
            box-shadow: -5px 0 15px rgba(0,0,0,0.5);
        }
        .cart-header { padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }
        .cart-header h3 { margin: 0; color: white; font-size: 18px; }
        .close-cart-icon { cursor: pointer; color: #aaa; font-size: 24px; }
        .close-cart-icon:hover { color: white; }
        .cart-items-container { flex: 1; overflow-y: auto; padding: 20px; }
        .cart-item { display: flex; align-items: center; background: #252535; padding: 10px; border-radius: 5px; margin-bottom: 10px; border: 1px solid #333; }
        .cart-item img { width: 50px; height: 50px; object-fit: contain; margin-right: 10px; }
        .cart-item-details { flex: 1; }
        .cart-item-title { font-size: 13px; color: #ddd; margin-bottom: 3px; display: block;}
        .cart-item-price { font-weight: bold; color: #00ff96; font-size: 14px; }
        .remove-item-btn { color: #ff4444; cursor: pointer; background: none; border: none; font-size: 16px; }
        .cart-footer { padding: 20px; background: #151525; border-top: 1px solid #333; }
        .clear-cart-btn { width: 100%; padding: 10px; background: rgba(255, 68, 68, 0.1); color: #ff4444; border: 1px solid #ff4444; border-radius: 5px; cursor: pointer; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s; }
        .clear-cart-btn:hover { background: #ff4444; color: white; }
        .cart-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; color: white; font-size: 18px; font-weight: bold; }
        .checkout-btn { width: 100%; padding: 15px; background: #00ff96; color: #000; border: none; border-radius: 5px; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.3s; }
        .checkout-btn:hover { background: #00cc7a; }

        .item-card { position: relative; } 

        .user-dropdown { position: relative; display: inline-block; cursor: pointer; }
        .user-dropdown-content {
            display: none; position: absolute; right: 0;
            background-color: #1b1b2f; min-width: 160px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
            z-index: 1000; border: 1px solid #333; border-radius: 5px;
        }
        .user-dropdown:hover .user-dropdown-content { display: block; }
        .user-dropdown-content a { color: white; padding: 12px 16px; text-decoration: none; display: block; }
        .user-dropdown-content a:hover { background-color: #252535; color: #00ff96; }

        @media (max-width: 768px) { .modal-body { flex-direction: column; } .product-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 1300px; max-width: 95%; background-color: #1b1b2f; border-radius: 12px; z-index: 10001; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); padding: 30px; color: white; } }
        
        /* EK ÖDEME MODALI STİLLERİ (Mevcut stillerine uyumlu) */
        .payment-modal-custom { max-width: 500px !important; flex-direction: column !important; gap: 20px !important; }
        .payment-header h2 { color: #00ff96; text-align: center; }
        .payment-header p { color: #aaa; text-align: center; font-size: 14px; }
        .payment-summary-box { background: rgba(0,255,150,0.1); padding: 15px; border-radius: 5px; display: flex; justify-content: space-between; font-weight: bold; color: white; margin-bottom: 15px; }
        .form-group label { display: block; color: #ccc; font-size: 13px; margin-bottom: 5px; }
        .form-group input { width: 100%; padding: 10px; background: #252535; border: 1px solid #444; color: white; border-radius: 5px; outline: none; }
        .row { display: flex; gap: 15px; } .col { flex: 1; }
        .pay-btn { width: 100%; padding: 12px; background: #00ff96; border: none; font-weight: bold; border-radius: 5px; margin-top: 10px; cursor: pointer; }
      `}</style>

      {/* NAVBAR */}
      <nav className="main-navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <a href="/" className="site-logo">
              <img src="/resimler/kelebek.png" alt="Logo" /> 
              <span>CS2SkinMarket</span>
            </a>
          </div>
          <div className="navbar-center">
             <a href="#" className="nav-btn market-btn active" onClick={() => setShowFavsOnly(false)}>
               <img src="/resimler/marketicon.png" alt="Logo" /> Market
             </a>
             <a href="#" className="nav-btn fastsell-btn">
               <img src="/resimler/thunder.png" alt="Logo" /> Hızlı Sat
             </a>
           </div>
          <div className="navbar-right">
            {!user ? (
              <a className="steam-btn" href="http://localhost:3001/auth/steam">
                <i className="fab fa-steam"></i> <span>Steam ile giriş yap</span>
              </a>
            ) : (
              <div className="user-dropdown">
                  <div className="top-right-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ color: '#00ff96', fontSize: '12px' }}>₺ {user.balance || "1250.00"}</div>
                    </div>
                    <img src={user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  </div>
                  <div className="user-dropdown-content">
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowFavsOnly(false); }}>
                          <i className="fas fa-th-large"></i> Tüm Ürünler
                      </a>
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowFavsOnly(true); }}>
                          <i className="fas fa-heart" style={{color: '#ff4444'}}></i> Favorilerim
                      </a>
                      <a href="http://localhost:3001/logout">
                          <i className="fas fa-sign-out-alt"></i> Çıkış Yap
                      </a>
                  </div>
              </div>
            )}
          </div>
        </div>
      </nav>
{/* KATEGORİ MENÜSÜ */}
      <nav className="category-nav">
        <div className="category-container">
          <ul className="category-links">
            
            {/* BIÇAK */}
            <li onClick={() => handleCategoryChange('knives-content')} className={activeTab === 'knives-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_weapon_knife_butterfly.png" className="nav-icon" alt="Bıçak"/> 
                    Bıçak
                </a>
            </li>

            {/* ELDİVENLER */}
            <li onClick={() => handleCategoryChange('gloves-content')} className={activeTab === 'gloves-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_motorcycle_gloves.png" className="nav-icon" alt="Eldivenler"/> 
                    Eldivenler
                </a>
            </li>

            {/* TABANCA */}
            <li onClick={() => handleCategoryChange('pistols-content')} className={activeTab === 'pistols-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_weapon_deagle.png" className="nav-icon" alt="Tabanca"/> 
                    Tabanca
                </a>
            </li>

            {/* HAFİF MAKİNELİ */}
            <li onClick={() => handleCategoryChange('smgs-content')} className={activeTab === 'smgs-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_weapon_mac10.png" className="nav-icon" alt="Hafif Makineli"/> 
                    Hafif Mak.
                </a>
            </li>

            {/* TÜFEKLER */}
            <li onClick={() => handleCategoryChange('rifles-content')} className={activeTab === 'rifles-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_weapon_ak47.png" className="nav-icon" alt="Tüfekler"/> 
                    Tüfekler
                </a>
            </li>

            {/* DÜRBÜNLÜ TÜFEKLER */}
            <li onClick={() => handleCategoryChange('sniper-content')} className={activeTab === 'sniper-content' && !showFavsOnly ? 'active' : ''}>
                <a href="#" className="nav-link">
                    <img src="/resimler/Inventory_icon_weapon_awp.png" className="nav-icon" alt="Dürbünlü Tüfekler"/> 
                    Dürbünlü Tüfekler
                </a>
            </li>

          </ul>
          
          <div className="cart-section">
            <button className="cart-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
              <i className="fas fa-shopping-cart"></i>
              <span className="nav-cart-price">
                 ₺ {cartTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ANA İÇERİK */}
      <div className="page-content-wrapper">
        <aside className="filter-sidebar">
          <h3>Filtreler</h3>
          <div className="filter-group">
              <h4>Fiyat Aralığı</h4>
              <div className="fiyat-kapsayici">
                 <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                 <span className="fiyat-tire">-</span>
                 <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
          </div>
          <div className="filter-group">
              <h4>Dış Görünüş</h4>
              <label><input type="checkbox" value="Fabrikadan Yeni Çıkmış" onChange={handleWearChange}/> Fabrikadan Yeni Çıkmış</label>
              <label><input type="checkbox" value="Az Aşınmış" onChange={handleWearChange}/> Az Aşınmış</label>
              <label><input type="checkbox" value="Görevde Kullanılmış" onChange={handleWearChange}/> Görevde Kullanılmış</label>
              <label><input type="checkbox" value="Eskimiş" onChange={handleWearChange}/> Eskimiş</label>
              <label><input type="checkbox" value="Savaş Görmüş" onChange={handleWearChange}/> Savaş Görmüş</label>
          </div>
          <div className="filter-group">
              <h4>Sıralama</h4>
              <select onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="default">Önerilen</option>
                  <option value="fiyat-dusuk">Fiyata Göre (Artan)</option>
                  <option value="fiyat-yuksek">Fiyata Göre (Azalan)</option>
              </select>
          </div>
          <button className="filter-apply-button" onClick={applyFilters}>Filtrele</button>
        </aside>

        <div className="container">
          {showFavsOnly && <h2 style={{color:'white', marginBottom:'20px'}}>❤️ Favori Ürünlerin</h2>}
          <section className="content-section" style={{ display: 'block' }}>
            <div className="item-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const rawId = product.item_id || product.db_id || product.id;
                  const prodId = String(rawId);
                  const isFav = favorites.includes(prodId);

                  return (
                    <div key={prodId || index} className="item-card" onClick={() => setModalData(product)}>
                      <button 
                          className={`fav-btn ${isFav ? 'active' : ''}`} 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(prodId); }}
                      >
                          <i className={isFav ? "fas fa-heart" : "far fa-heart"}></i>
                      </button>
                      <img src={product.img} alt={product.name} />
                      <div className="item-card-info">
                        <h3>{product.name}</h3>
                        <p>₺ {parseFloat(product.price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</p>
                        <button className="eklemebtn add-to-cart" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                          <i className="fas fa-shopping-cart"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{color:'white', padding:'20px', gridColumn: '1 / -1', textAlign:'center'}}>
                   <h3>⚠️ Ürün Bulunamadı</h3>
                   <p>{showFavsOnly ? "Henüz favorilediğin bir ürün yok." : "Filtreleri değiştirip tekrar butona bas."}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ÜRÜN MODALI */}
      {modalData && (
        <div className="product-modal-overlay active" onClick={() => setModalData(null)}>
          <div className="product-modal active" onClick={(e) => e.stopPropagation()}>
            <div className="close-modal-btn" onClick={() => setModalData(null)}>&times;</div>
            <div className="modal-body">
              <div className="modal-left"><img src={modalData.img} alt={modalData.name} /></div>
              <div className="modal-right">
                <h2>{modalData.name}</h2>
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '14px', marginBottom: '5px' }}>
                    <span>Float</span><span>{modalData.float_val || "-"}</span>
                  </div>
                  <div style={{ height: '8px', background: 'linear-gradient(to right, #4caf50, #ffeb3b, #f44336)', borderRadius: '4px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-4px', width: '4px', height: '16px', background: 'white', border:'1px solid black', left: `${(parseFloat(modalData.float_val || 0)) * 100}%` }}></div>
                  </div>
                </div>
                <div className="detail-row"><span>Dış Görünüş</span><span style={{ color: '#00ff96', fontWeight: 'bold' }}>{getWearName(modalData.float_val)}</span></div>
                <div className="detail-row"><span>Nadirlik</span><span style={{ color: '#00ff96', fontWeight: 'bold' }}>{modalData.rarity || "Bilinmiyor"}</span></div>
                <div className="modal-price-box">
                  <span style={{ display: 'block', color: '#aaa', fontSize: '14px' }}>Satış Fiyatı</span>
                  <span className="price-text">₺ {parseFloat(modalData.price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                  <button onClick={() => { addToCart(modalData); setModalData(null); }} style={{ width: '100%', padding: '15px', background: '#00ff96', border: 'none', borderRadius:'8px', fontSize: '18px', fontWeight:'bold', cursor: 'pointer', color:'black', display:'flex', justifyContent:'center', gap:'10px' }}>
                    <i className="fas fa-shopping-cart"></i> Sepete Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ÖDEME MODALI*/}
      {isPaymentModalOpen && (
        <div className="product-modal-overlay active" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="product-modal active payment-modal-custom" onClick={(e) => e.stopPropagation()}>
            <div className="close-modal-btn" onClick={() => setIsPaymentModalOpen(false)}>&times;</div>
            <div className="payment-modal-content">
                <div className="payment-header">
                  <h2><i className="fas fa-credit-card"></i> Güvenli Ödeme</h2>
                  <p>Kart bilgilerinizi girerek ödemeyi tamamlayın.</p>
                </div>
                <div className="payment-summary-box">
                   <span>Ödenecek Tutar:</span>
                   <span className="amount">₺ {cartTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </div>
                <form onSubmit={handlePaymentSubmit}>
                  <div className="form-group"><label>Kart Numarası</label><input type="text" name="cardNumber" placeholder="0000 0000 0000 0000" maxLength="19" value={paymentForm.cardNumber} onChange={handlePaymentInputChange} required /></div>
                  <div className="row">
                    <div className="col form-group"><label>SKT (Ay/Yıl)</label><input type="text" name="expiry" placeholder="AA/YY" maxLength="5" value={paymentForm.expiry} onChange={handlePaymentInputChange} required style={{textAlign:'center'}} /></div>
                    <div className="col form-group"><label>CVV</label><input type="password" name="cvv" placeholder="123" maxLength="3" value={paymentForm.cvv} onChange={handlePaymentInputChange} required style={{textAlign:'center'}} /></div>
                  </div>
                  <button type="submit" className="pay-btn" disabled={paymentLoading}>{paymentLoading ? "İşleniyor..." : "Ödemeyi Tamamla"}</button>
                </form>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div 
            className="cart-overlay" 
            onClick={() => setIsCartOpen(false)}
        ></div>
      )}

      {/* SEPET SIDEBAR */}
      <div className={`cart-sidebar ${isCartOpen ? 'active' : ''}`} style={{
           position:'fixed', right:0, top:0, height:'100%', width:'360px', 
           background:'#1b1b2f', zIndex:10000, display:'flex', flexDirection:'column',
           transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)', transition:'0.3s', 
           borderLeft:'1px solid #333', boxShadow: '-5px 0 15px rgba(0,0,0,0.5)'
      }}>
           <div className="cart-header"><h3>Alışveriş Sepeti</h3><span className="close-cart-icon" onClick={()=>setIsCartOpen(false)}>&times;</span></div>
<div className="cart-items-container">
               {cart.length === 0 ? <div style={{color:'#777', textAlign:'center', marginTop:'50px'}}>Sepetiniz boş.</div> : 
                   cart.map((item, i) => (
                       <div key={i} className="cart-item">
                           <img src={item.img} alt={item.name} />
                           
                           <div className="cart-item-details" style={{flex:1}}>
                               <span className="cart-item-title" style={{fontSize:'13px', color:'#ddd'}}>{item.name}</span>

                               <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                                   <span style={{color:'#00ff96', fontSize:'12px', fontWeight:'bold'}}>
                                       {item.quantity || 1} x ₺{parseFloat(item.price).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                                   </span>
                               </div>
                               <div style={{color:'white', fontWeight:'bold', fontSize:'14px', marginTop:'2px'}}>
                                   Toplam: ₺ {(parseFloat(item.price) * (item.quantity || 1)).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                               </div>
                           </div>

                           <div className="cart-actions" style={{display:'flex', flexDirection:'column', gap:'5px', marginLeft:'10px'}}>
                               
                               <button 
                                   onClick={() => addToCart(item)} 
                                   style={{
                                       width:'25px', height:'25px', 
                                       background:'#00ff96', border:'none', borderRadius:'5px', 
                                       cursor:'pointer', fontWeight:'bold', fontSize:'14px', color:'#000',
                                       display:'flex', alignItems:'center', justifyContent:'center'
                                   }}
                               >
                                   +
                               </button>

                               <button 
                                   onClick={() => decreaseFromCart(i)} 
                                   style={{
                                       width:'25px', height:'25px', 
                                       background:'rgba(255, 68, 68, 0.2)', border:'1px solid #ff4444', borderRadius:'5px', 
                                       cursor:'pointer', fontWeight:'bold', fontSize:'14px', color:'#ff4444',
                                       display:'flex', alignItems:'center', justifyContent:'center'
                                   }}
                               >
                                   -
                               </button>

                           </div>
                       </div>
                   ))
               }
           </div>
           <div className="cart-footer">
               <button className="clear-cart-btn" onClick={clearCart}><i className="fas fa-trash"></i> Sepeti Boşalt</button>
               <div className="cart-total-row" style={{display:'flex', justifyContent:'space-between', color:'white', fontWeight:'bold', marginBottom:'15px'}}><span>Toplam:</span><span>₺ {cartTotal.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span></div>
               <button className="checkout-btn" onClick={() => { if (cart.length === 0) alert("Sepet boş!"); else { setIsCartOpen(false); setIsPaymentModalOpen(true); } }}>Ödemeye Geç</button>
           </div>
      </div>
    </div>
  );
}

export default App;