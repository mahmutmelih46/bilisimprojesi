// --- ÖDEME SAYFASI ve İŞLEMLERİ ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ödeme Sayfasında Toplam Tutarı Göster
    if (document.getElementById('paymentTotal')) {
        const cart = JSON.parse(localStorage.getItem('myCS2Cart')) || [];
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });
        
        if (total === 0) {
            alert("Sepetiniz boş, ana sayfaya yönlendiriliyorsunuz.");
            window.location.href = 'index.html';
        }
        document.getElementById('paymentTotal').innerText = '₺ ' + total.toLocaleString('tr-TR');
    }

    // 2. YENİ BACKEND ENTEGRASYONLU ÖDEME SİSTEMİ 💳
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const cardNumberInput = document.getElementById('card-number');
            const expiryInput = document.getElementById('expiry-date');
            const cvvInput = document.getElementById('cvv');
            const cardNumber = cardNumberInput ? cardNumberInput.value : "0000000000000000";
            const expiry = expiryInput ? expiryInput.value : "00/00";
            const cvv = cvvInput ? cvvInput.value : "000";
            const cart = JSON.parse(localStorage.getItem('myCS2Cart')) || [];
            let totalAmount = 0;
            cart.forEach(item => totalAmount += item.price * item.quantity);

            if (totalAmount === 0) {
                alert("Sepet boş, işlem yapılamaz!");
                return;
            }

            const submitBtn = paymentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Banka ile görüşülüyor...";
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            try {
                const response = await fetch('http://localhost:3001/api/pay', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cardNumber: cardNumber,
                        expiry: expiry,
                        cvv: cvv,
                        amount: totalAmount
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert("✅ " + result.message);
                    localStorage.removeItem('myCS2Cart'); 
                    window.location.href = 'index.html'; 
                } else {
                    alert("❌ HATA: " + (result.message || "Ödeme işlemi başarısız."));
                }

            } catch (error) {
                console.error("Ödeme hatası:", error);
                alert("❌ Sunucuya (Backend) ulaşılamadı! 'node server.js' çalışıyor mu?");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
            }
        });
    }
});

function simulatePayment(methodName) {
    alert(methodName + " ile güvenli ödeme sayfasına yönlendiriliyorsunuz...");
    setTimeout(() => {
        if (methodName === 'PayPal') {
            window.location.href = "https://www.paypal.com/paypalme/steammarketdemo/100";
        } else {
            alert("Ödeme " + methodName + " ile başarıyla alındı!");
            localStorage.removeItem('myCS2Cart');
            window.location.href = 'index.html';
        }
    }, 1500);
}

document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll(".category-nav .nav-link");
    const contentSections = document.querySelectorAll(".content-section");
    
    function setDefaultActiveSection() {
        contentSections.forEach(section => {
            section.classList.remove("active");
        });
        navLinks.forEach(navLink => {
            navLink.classList.remove("active");
        });
        
        const knivesSection = document.getElementById("knives-content");
        const knivesNavLink = document.querySelector('.nav-link[data-target="knives-content"]');
        
        if (knivesSection && knivesNavLink) {
            knivesSection.classList.add("active");
            knivesNavLink.classList.add("active");
        }
    }
    
    setDefaultActiveSection();
    
    navLinks.forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            const targetId = this.getAttribute("data-target");
            contentSections.forEach(section => {
                section.classList.remove("active");
            });
            navLinks.forEach(navLink => {
                navLink.classList.remove("active");
            });
            document.getElementById(targetId).classList.add("active");
            this.classList.add("active");
        });
    });

    // --- SEPET AÇMA KAPAMA (SIDEBAR) ---
    const cartButton = document.querySelector('.cart-btn'); 
    const sidebar = document.getElementById('shoppingCartSidebar');
    const overlay = document.getElementById('cartOverlay');
    const closeBtn = document.querySelector('.close-cart-btn');

    function openCart() {
        if(sidebar) sidebar.classList.add('active');
        if(overlay) overlay.classList.add('active');
    }
    function closeCart() {
        if(sidebar) sidebar.classList.remove('active');
        if(overlay) overlay.classList.remove('active');
    }
    if(cartButton) {
        cartButton.addEventListener('click', function(e) {
            e.preventDefault();
            openCart();
        });
    }
    if(closeBtn) closeBtn.addEventListener('click', closeCart);
    if(overlay) overlay.addEventListener('click', closeCart);

    // --- SEPET MANTIĞI (LocalStorage) ---
    let cart = JSON.parse(localStorage.getItem('myCS2Cart')) || [];
    const cartItemsWrapper = document.querySelector('.cart-items-container');
    
    updateCartHTML();

    // Ürün Ekleme (Dinamik Butonlar İçin Delegate Event)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-to-cart') || e.target.closest('.eklemebtn')) {
            e.preventDefault();
            const button = e.target.closest('.add-to-cart') || e.target.closest('.eklemebtn');
            
            const product = {
                id: button.getAttribute('data-id'),
                name: button.getAttribute('data-name'),
                price: parseFloat(button.getAttribute('data-price')),
                img: button.getAttribute('data-img'),
                quantity: 1
            };

            if (!product.id || !product.name || !product.price || !product.img) {
                console.error('Ürün bilgileri eksik:', product);
                return;
            }
            
            addToCart(product);
        }
    });

    function addToCart(product) {
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push(product);
        }
        
        saveCart();
        updateCartHTML();
        showAddToCartFeedback(product.name);
    }
    
    function showAddToCartFeedback(productName) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff96, #00cc7a);
            color: #000;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 15px rgba(0, 255, 150, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${productName} sepete eklendi!`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    function removeFromCart(productId) {
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex === -1) return;
        
        const item = cart[itemIndex];
        
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        
        saveCart();
        updateCartHTML();
    }

    function saveCart() {
        localStorage.setItem('myCS2Cart', JSON.stringify(cart));
    }

    function updateCartHTML() {
        if (!cartItemsWrapper) return;

        cartItemsWrapper.innerHTML = '';
        let totalPrice = 0;
        let totalCount = 0;

        if (cart.length === 0) {
            cartItemsWrapper.innerHTML = '<div style="text-align:center; color:#777; margin-top:20px;">Sepetiniz boş.</div>';
        }

        cart.forEach(item => {
            totalPrice += item.price * item.quantity;
            totalCount += item.quantity;
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            
            cartItem.innerHTML = `
                <div style="display:flex; align-items:center; padding:12px; border-radius:10px; background-color:rgba(255,255,255,0.05); margin-bottom:8px; border: 1px solid rgba(255,255,255,0.05);">
                    <img src="${item.img}" style="width:70px; height:64px; object-fit:contain; background-color:rgba(0,0,0,0.2); border-radius:8px; flex-shrink: 0;">
                    <div style="flex-grow:1; margin-left:12px; display:flex; flex-direction:column; justify-content:center;">
                        <h4 style="font-size:14px; color:white; margin:0 0 8px 0; font-weight:600; line-height: 1.2;">${item.name}</h4>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#00ff96; font-size:11px; font-weight:550; background: rgba(0, 255, 150, 0.1); padding: 2px 6px; border-radius: 4px;">
                                ${item.quantity} x ₺${item.price.toLocaleString('tr-TR')}
                            </span>
                            <span style="color:#fff; font-weight:600; font-size:13px; letter-spacing: 0.5px;">
                                ₺${(item.price * item.quantity).toLocaleString('tr-TR')}
                            </span>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <button class="add-item-btn" data-item-id="${item.id}" style="background:#00ff96; border:none; color:#000; cursor:pointer; font-size:12px; padding:4px 8px; border-radius:4px; font-weight:bold;">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="remove-item-btn" data-item-id="${item.id}" title="Ürün Çıkar">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
            `;
            
            const removeBtn = cartItem.querySelector('.remove-item-btn');
            removeBtn.addEventListener('click', function() {
                removeFromCart(this.getAttribute('data-item-id'));
            });
            
            const addBtn = cartItem.querySelector('.add-item-btn');
            addBtn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                const existingItem = cart.find(cartItem => cartItem.id === itemId);
                if (existingItem) {
                    addToCart({ ...existingItem, quantity: 1 });
                }
            });
            
            cartItemsWrapper.appendChild(cartItem);
        });

        // Toplam Tutarı Güncelle
        const cartTotalSpan = document.querySelector('.cart-total span:last-child');
        if(cartTotalSpan) cartTotalSpan.innerText = '₺ ' + totalPrice.toLocaleString('tr-TR');

        // Ödeme Butonu İşlemi
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                if (!cart || cart.length === 0) {
                    alert("Sepetiniz boş! Önce ürün ekleyin.");
                    return;
                }
                window.location.href = 'odeme.html'; 
            });
        }

        // Navbardaki Sepet İkonunu Güncelle
        const navCartBtn = document.querySelector('.cart-btn');
        const navCartPriceSpan = document.querySelector('.nav-cart-price');
        if (navCartBtn && navCartPriceSpan) {
            if (totalPrice > 0) {
                navCartBtn.classList.add('has-items');
                navCartPriceSpan.innerText = '₺ ' + totalPrice.toLocaleString('tr-TR');
            } else {
                navCartBtn.classList.remove('has-items');
                navCartPriceSpan.innerText = '';
            }
        }
    }

    // Sepeti Temizle Butonu
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (cart.length === 0) return; 
            cart = []; 
            saveCart(); 
            updateCartHTML(); 
        });
    }

    // --- ÜRÜN MODAL (POPUP) ---
    const modal = document.getElementById('productModal');
    const modalOverlay = document.getElementById('productModalOverlay');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const productCards = document.querySelectorAll('.open-modal-trigger');
    
    productCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.add-to-cart')) return; 
            
            const img = this.getAttribute('data-img');
            const name = this.getAttribute('data-name');
            const price = this.getAttribute('data-price');
            const float = this.getAttribute('data-float') || 'Belirtilmemiş';
            const rarity = this.getAttribute('data-rarity') || 'Bilinmiyor';
            const pattern = this.getAttribute('data-pattern') || '-';
            
            const modalImg = document.getElementById('modalImage');
            if(modalImg) modalImg.src = img;
            
            const modalTitle = document.getElementById('modalTitle');
            if(modalTitle) modalTitle.innerText = name;
            
            const modalPrice = document.getElementById('modalPrice');
            if(modalPrice) modalPrice.innerText = '₺ ' + parseFloat(price).toLocaleString('tr-TR');
            
            if(document.getElementById('modalFloat')) document.getElementById('modalFloat').innerText = float;
            if(document.getElementById('modalRarity')) document.getElementById('modalRarity').innerText = rarity;
            if(document.getElementById('modalPattern')) document.getElementById('modalPattern').innerText = pattern;
            
            const modalBtn = document.getElementById('modalAddToCartBtn');
            if(modalBtn) {
                modalBtn.onclick = function() {
                    addToCart({
                        id: card.getAttribute('data-id'),
                        name: name,
                        price: parseFloat(price),
                        img: img,
                        quantity: 1
                    });
                };
            }
            
            if(modal) modal.classList.add('active');
            if(modalOverlay) modalOverlay.classList.add('active');
        });
    });
    
    function closeProductModal() {
        if(modal) modal.classList.remove('active');
        if(modalOverlay) modalOverlay.classList.remove('active');
    }
    
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeProductModal);
    if(modalOverlay) modalOverlay.addEventListener('click', closeProductModal);
});

// --- HIZLI SATIŞ MODALI ---
document.addEventListener('DOMContentLoaded', () => {
    const fastSellBtn = document.querySelector('.fastsell-btn');
    if (fastSellBtn) {
        fastSellBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const userSkins = [
                { name: "AK-47 | Redline", condition: "Field-Tested", price: 2450.00 },
                { name: "M4A4 | Asiimov", condition: "Battle-Scarred", price: 1850.00 },
                { name: "AWP | Lightning Strike", condition: "Factory New", price: 3200.00 },
                { name: "Glock-18 | Water Elemental", condition: "Minimal Wear", price: 890.00 },
                { name: "USP-S | Kill Confirmed", condition: "Field-Tested", price: 2100.00 }
            ];
            const randomSkin = userSkins[Math.floor(Math.random() * userSkins.length)];
            showFastSellModal(randomSkin);
        });
    }
});

function showFastSellModal(skin) {
    const modalHTML = `
        <div id="fastSellModal" class="fast-sell-modal">
            <div class="fast-sell-overlay"></div>
            <div class="fast-sell-content">
                <div class="fast-sell-header">
                    <h2><i class="fas fa-bolt"></i> Hızlı Sat</h2>
                    <button class="close-fast-sell">&times;</button>
                </div>
                <div class="fast-sell-body">
                    <div class="skin-preview">
                        <div class="skin-info">
                            <h3>${skin.name}</h3>
                            <p class="condition">Durum: ${skin.condition}</p>
                            <div class="price-section">
                                <div class="market-price">
                                    <span>Market Fiyatı: ₺${skin.price.toLocaleString('tr-TR')}</span>
                                </div>
                                <div class="instant-price">
                                    <span>Anında Sat: ₺${(skin.price * 0.85).toLocaleString('tr-TR')}</span>
                                    <small>(Market fiyatının %85'i)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sell-actions">
                        <button class="instant-sell-btn">
                            <i class="fas fa-lightning-bolt"></i>
                            Anında Sat (₺${(skin.price * 0.85).toLocaleString('tr-TR')})
                        </button>
                        <button class="market-sell-btn">
                            <i class="fas fa-store"></i>
                            Market'e Koy (₺${skin.price.toLocaleString('tr-TR')})
                        </button>
                    </div>
                    <div class="fast-sell-info">
                        <p><i class="fas fa-info-circle"></i> Hızlı satışta para anında cüzdanınıza yatar.</p>
                        <p><i class="fas fa-clock"></i> Market satışı daha yüksek fiyat ama daha uzun sürer.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('fastSellModal');
    const closeBtn = document.querySelector('.close-fast-sell');
    const overlay = document.querySelector('.fast-sell-overlay');
    const instantSellBtn = document.querySelector('.instant-sell-btn');
    const marketSellBtn = document.querySelector('.market-sell-btn');
    
    const closeFastSellModal = () => {
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeFastSellModal);
    overlay.addEventListener('click', closeFastSellModal);
    
    instantSellBtn.addEventListener('click', () => {
        alert(`✅ ${skin.name} başarıyla ₺${(skin.price * 0.85).toLocaleString('tr-TR')} karşılığında satıldı!\n💰 Para cüzdanınıza yatırıldı.`);
        closeFastSellModal();
    });
    
    marketSellBtn.addEventListener('click', () => {
        alert(`📈 ${skin.name} market'e ₺${skin.price.toLocaleString('tr-TR')} fiyatıyla listelendi!\n⏰ Alıcı bulunduğunda bilgilendirileceksiniz.`);
        closeFastSellModal();
    });
}

// --- OTOMATİK BUTON OLUŞTURMA (HTML'deki kartlar için) ---
document.addEventListener("DOMContentLoaded", function() {
    const itemCards = document.querySelectorAll('.item-card');
    
    itemCards.forEach((card, index) => {
        const cardInfo = card.querySelector('.item-card-info');
        const existingButton = card.querySelector('.add-to-cart');
        
        if (existingButton && existingButton.classList.contains('add-to-cart')) {
            return;
        }
        
        const brokenButtons = card.querySelectorAll('button[href], .eklemebtn:not(.add-to-cart)');
        brokenButtons.forEach(btn => btn.remove());
        
        if (cardInfo) {
            const h3 = cardInfo.querySelector('h3');
            const p = cardInfo.querySelector('p');
            const img = card.querySelector('img');
            
            if (h3 && p && img) {
                const productName = h3.textContent.trim();
                const priceText = p.textContent.replace('₺', '').replace(/\./g, '').replace(',', '.').trim();
                const price = parseFloat(priceText) || 0;
                const imageUrl = img.src;
                const productId = `item_generated_${index}`;
                
                const newButton = document.createElement('button');
                newButton.className = 'eklemebtn add-to-cart';
                newButton.setAttribute('data-id', productId);
                newButton.setAttribute('data-name', productName);
                newButton.setAttribute('data-price', price.toString());
                newButton.setAttribute('data-img', imageUrl);
                
                newButton.innerHTML = `<i class="fas fa-shopping-cart"></i>`;
                
                cardInfo.appendChild(newButton);
            }
        }
    });
});

// --- VARSAYILAN KATEGORİ SEÇİMİ ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const activeSection = document.querySelector('.content-section.active');
        if (!activeSection) {
            const knivesSection = document.getElementById("knives-content");
            const knivesNavLink = document.querySelector('.nav-link[data-target="knives-content"]');
            
            if (knivesSection && knivesNavLink) {
                knivesSection.classList.add("active");
                knivesNavLink.classList.add("active");
            }
        }
    }, 500);
});

// --- FİLTRELEME İŞLEVİ ---
document.addEventListener('DOMContentLoaded', function() {
    const minPriceInput = document.querySelector('.fiyat-kapsayici input:nth-child(1)'); 
    const maxPriceInput = document.querySelector('.fiyat-kapsayici input:nth-child(3)'); 
    const filterButton = document.querySelector('.filter-apply-button'); 
    const productCards = document.querySelectorAll('.item-card'); 
    const wearCheckboxes = document.querySelectorAll('.wear-checkbox');

    function getWearNameFromFloat(floatVal) {
        const f = parseFloat(floatVal);
        if (isNaN(f)) return "Bilinmiyor"; 
        
        if (f < 0.07) return "Fabrikadan Yeni Çıkmış";
        if (f < 0.15) return "Az Aşınmış";
        if (f < 0.38) return "Görevde Kullanılmış";
        if (f < 0.45) return "Eskimiş";
        return "Savaş Görmüş";
    }

    if(filterButton) {
        filterButton.addEventListener('click', function() {
            let minPrice = parseFloat(minPriceInput.value.replace(',', '.')) || 0;
            let maxPrice = parseFloat(maxPriceInput.value.replace(',', '.')) || Infinity;
            let selectedWears = [];
            wearCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedWears.push(checkbox.value);
                }
            });

            console.log("Seçilen Filtreler:", selectedWears); 

            productCards.forEach(card => {
                const productPrice = parseFloat(card.getAttribute('data-price'));
                const productFloat = card.getAttribute('data-float');
                const productWearName = getWearNameFromFloat(productFloat);
                const isPriceMatch = (productPrice >= minPrice && productPrice <= maxPrice);
                const isWearMatch = (selectedWears.length === 0) || (selectedWears.includes(productWearName));

                if (isPriceMatch && isWearMatch) {
                    card.style.display = 'block'; 
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});

// --- SIRALAMA İŞLEVİ ---
document.addEventListener('DOMContentLoaded', function() {
    const sortSelect = document.querySelector('select[name="siralama"]');

    if(sortSelect) {
        sortSelect.addEventListener('change', function() {
            const selectedOption = this.value;
            const allGrids = document.querySelectorAll('.item-grid');

            allGrids.forEach(grid => {
                const cards = Array.from(grid.querySelectorAll('.item-card'));

                cards.sort((cardA, cardB) => {
                    const priceA = parseFloat(cardA.getAttribute('data-price'));
                    const priceB = parseFloat(cardB.getAttribute('data-price'));

                    if (selectedOption === 'fiyat-dusuk') {
                        return priceA - priceB; 
                    } else {
                        return priceB - priceA; 
                    }
                });
                cards.forEach(card => {
                    grid.appendChild(card);
                });
            });
        });
    }
});

// --- FAVORİ SİSTEMİ BAŞLANGIÇ ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Kullanıcı Bilgisini Çek (Giriş yapmış mı?)
    let currentUser = null;
    let userFavorites = [];

    try {
        const userRes = await fetch('http://localhost:3001/me', { credentials: 'include' });
        if (userRes.ok) {
            currentUser = await userRes.json();
        }
    } catch (e) { console.log("Kullanıcı kontrol edilemedi"); }

    // 2. Eğer giriş yapmışsa, favori listesini çek
    if (currentUser) {
        setupUserDropdown(currentUser); 
        try {
            const favRes = await fetch('http://localhost:3001/api/favorites', { credentials: 'include' });
            if (favRes.ok) {
                userFavorites = await favRes.json();
            }
        } catch (e) { console.log("Favoriler çekilemedi"); }
    }

    // 3. Her karta Kalp Butonu Ekle ve Rengini Ayarla
    const cards = document.querySelectorAll('.item-card');
    cards.forEach(card => {
        card.style.position = 'relative';

        const itemId = card.getAttribute('data-id');
        const isFav = userFavorites.includes(itemId);
        const favBtn = document.createElement('button');
        favBtn.className = `fav-btn ${isFav ? 'active' : ''}`;
        favBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        
        favBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            
            if (!currentUser) {
                alert("Favorilere eklemek için Steam ile giriş yapmalısın !");
                return;
            }

            // Backend'e istek at
            try {
                const response = await fetch('http://localhost:3001/api/favorites/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId: itemId })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (result.action === 'added') {
                        favBtn.classList.add('active');
                        favBtn.innerHTML = '<i class="fas fa-heart"></i>';
                        userFavorites.push(itemId); 
                    } else {
                        favBtn.classList.remove('active');
                        favBtn.innerHTML = '<i class="far fa-heart"></i>';
                        userFavorites = userFavorites.filter(id => id !== itemId); 
                    }
                }
            } catch (err) {
                console.error("Favori işlemi hatası:", err);
            }
        });

        card.appendChild(favBtn);
    });

    // --- KULLANICI MENÜSÜNÜ AYARLA ---
    function setupUserDropdown(user) {
        const navbarRight = document.querySelector('.navbar-right');
        if (!navbarRight) return;

        navbarRight.innerHTML = `
            <div class="user-dropdown" style="position: relative; display: inline-block; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="text-align: right;">
                        <div style="color: #fff; font-weight: bold;">${user.name}</div>
                        <div style="color: #00ff96; font-size: 12px;">₺ ${user.balance || "1250.00"}</div>
                    </div>
                    <img src="${user.avatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #00ff96;">
                </div>
                
                <div class="user-dropdown-content">
                    <a href="#" id="showFavoritesBtn"><i class="fas fa-heart" style="color: #ff4444;"></i> Favorilerim</a>
                    <a href="http://localhost:3001/logout"><i class="fas fa-sign-out-alt"></i> Çıkış Yap</a>
                </div>
            </div>
        `;

        const showFavBtn = document.getElementById('showFavoritesBtn');
        if (showFavBtn) {
            showFavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Favoriler gösteriliyor...");
                
                const allCards = document.querySelectorAll('.item-card');
                let foundCount = 0;

                allCards.forEach(card => {
                    const wrapper = card.closest('a') || card; 
                    const id = card.getAttribute('data-id');

                    if (userFavorites.includes(id)) {
                        wrapper.style.display = ''; 
                        foundCount++;
                    } else {
                        wrapper.style.display = 'none'; 
                    }
                });

                if (foundCount === 0) {
                    alert("Henüz favorilediğin bir ürün yok!");

                } else {
                    window.scrollTo({ top: document.querySelector('.content-section').offsetTop - 100, behavior: 'smooth' });
                }
            });
        }
    }
});