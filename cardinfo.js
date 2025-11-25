// --- ÖDEME SAYFASI (odeme.html) için JS ---
document.addEventListener('DOMContentLoaded', () => {
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
	const paymentForm = document.getElementById('paymentForm');
	if (paymentForm) {
		paymentForm.addEventListener('submit', function(e) {
			e.preventDefault();
			alert("Ödemeniz başarıyla alındı! Siparişiniz hazırlanıyor. 🎉");
			localStorage.removeItem('myCS2Cart');
			window.location.href = 'index.html';
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
	const cartButton = document.querySelector('.cart-btn'); 
	const sidebar = document.getElementById('shoppingCartSidebar');
	const overlay = document.getElementById('cartOverlay');
	const closeBtn = document.querySelector('.close-cart-btn');
	function openCart() {
		sidebar.classList.add('active');
		overlay.classList.add('active');
	}
	function closeCart() {
		sidebar.classList.remove('active');
		overlay.classList.remove('active');
	}
	cartButton.addEventListener('click', function(e) {
		e.preventDefault();
		openCart();
	});
	closeBtn.addEventListener('click', closeCart);
	overlay.addEventListener('click', closeCart);
	let cart = JSON.parse(localStorage.getItem('myCS2Cart')) || [];
	const cartItemsWrapper = document.querySelector('.cart-items-container');
	const cartTotalElement = document.querySelector('.cart-total span:last-child');
	updateCartHTML();
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
		
		console.log('Ürün sepete eklendi:', product.name);
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
		
		if (itemIndex === -1) {
			console.warn('Ürün sepette bulunamadı:', productId);
			return;
		}
		
		const item = cart[itemIndex];
		
		if (item.quantity > 1) {
			item.quantity -= 1;
		} else {
			cart.splice(itemIndex, 1);
		}
		
		saveCart();
		updateCartHTML();
		
		console.log('Ürün sepetten çıkarıldı/azaltıldı:', productId);
	}
	function saveCart() {
		localStorage.setItem('myCS2Cart', JSON.stringify(cart));
	}
	function updateCartHTML() {
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
			
			<h4 style="font-size:14px; color:white; margin:0 0 8px 0; font-weight:600; line-height: 1.2;">
				${item.name}
			</h4>
			
			<div style="display:flex; justify-content:space-between; align-items:center;">
				
				<span style="color:#00ff96; font-size:11px; font-weight:550; background: rgba(0, 255, 150, 0.1); padding: 2px 6px; border-radius: 4px;">
					${item.quantity} x ₺${item.price.toLocaleString('tr-TR')}
				</span>
				
				<span style="color:#fff; font-weight:600; font-size:13px; letter-spacing: 0.5px;">
					₺${(item.price * item.quantity).toLocaleString('tr-TR')}
				</span>
			</div>
		</div>
	</div>
					<div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
						<button class="add-item-btn" data-item-id="${item.id}" style="background:#00ff96; border:none; color:#000; cursor:pointer; font-size:12px; padding:4px 8px; border-radius:4px; font-weight:bold;" title="Ürün Ekle">
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
				const itemId = this.getAttribute('data-item-id');
				removeFromCart(itemId);
			});
			
			const addBtn = cartItem.querySelector('.add-item-btn');
			addBtn.addEventListener('click', function() {
				const itemId = this.getAttribute('data-item-id');
				const existingItem = cart.find(cartItem => cartItem.id === itemId);
				if (existingItem) {
					addToCart({
						id: existingItem.id,
						name: existingItem.name,
						price: existingItem.price,
						img: existingItem.img,
						quantity: 1
					});
				}
			});
			
			removeBtn.addEventListener('mouseenter', function() {
				this.style.backgroundColor = 'rgba(255, 68, 68, 0.2)';
				this.style.transform = 'scale(1.1)';
			});
			
			removeBtn.addEventListener('mouseleave', function() {
				this.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
				this.style.transform = 'scale(1)';
			});
			
			addBtn.addEventListener('mouseenter', function() {
				this.style.backgroundColor = '#00cc7a';
				this.style.transform = 'scale(1.1)';
			});
			
			addBtn.addEventListener('mouseleave', function() {
				this.style.backgroundColor = '#00ff96';
				this.style.transform = 'scale(1)';
			});
			
			cartItemsWrapper.appendChild(cartItem);
		});
		cartTotalElement.innerText = '₺ ' + totalPrice.toLocaleString('tr-TR');
		const checkoutBtn = document.querySelector('.checkout-btn');
		if (checkoutBtn) {
			checkoutBtn.addEventListener('click', function() {
				if (!cart || cart.length === 0) {
					alert("Sepetiniz boş! Önce ürün ekleyin.");
					return;
				}
				window.location.href = 'odeme.html'; 
			});
		} else {
			console.error("HATA: 'Ödemeye Geç' butonu bulunamadı! HTML'deki class ismini kontrol edin.");
		}
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

const clearCartBtn = document.getElementById('clearCartBtn');

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', function() {
        
        if (cart.length === 0) {
            return; 
        }

        cart = []; 
        saveCart(); 
        updateCartHTML(); 
        
    });
}
	const modal = document.getElementById('productModal');
	const modalOverlay = document.getElementById('productModalOverlay');
	const closeModalBtn = document.querySelector('.close-modal-btn');
	const productCards = document.querySelectorAll('.open-modal-trigger');
	productCards.forEach(card => {
		card.addEventListener('click', function(e) {
			if (e.target.closest('.add-to-cart')) {
				return; 
			}
			const img = this.getAttribute('data-img');
			const name = this.getAttribute('data-name');
			const price = this.getAttribute('data-price');
			const float = this.getAttribute('data-float') || 'Belirtilmemiş';
			const rarity = this.getAttribute('data-rarity') || 'Bilinmiyor';
			const pattern = this.getAttribute('data-pattern') || '-';
			document.getElementById('modalImage').src = img;
			document.getElementById('modalTitle').innerText = name;
			document.getElementById('modalPrice').innerText = '₺ ' + parseFloat(price).toLocaleString('tr-TR');
			document.getElementById('modalFloat').innerText = float;
			document.getElementById('modalRarity').innerText = rarity;
			document.getElementById('modalPattern').innerText = pattern;
			const modalBtn = document.getElementById('modalAddToCartBtn');
			modalBtn.onclick = function() {
				addToCart({
					id: card.getAttribute('data-id'),
					name: name,
					price: parseFloat(price),
					img: img,
					quantity: 1
				});
			};
			modal.classList.add('active');
			modalOverlay.classList.add('active');
		});
	});
	function closeProductModal() {
		modal.classList.remove('active');
		modalOverlay.classList.remove('active');
	}
	closeModalBtn.addEventListener('click', closeProductModal);
	modalOverlay.addEventListener('click', closeProductModal);
});

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
                
                newButton.innerHTML = `
                    <i class="fas fa-shopping-cart"></i>
                `;
                
                cardInfo.appendChild(newButton);
            }
        }
    });
    
    const allButtons = document.querySelectorAll('.add-to-cart');
    console.log('Toplam ' + allButtons.length + ' buton hazır ve çalışıyor!');
});

document.addEventListener('DOMContentLoaded', () => {
	setTimeout(() => {
		const activeSection = document.querySelector('.content-section.active');
		if (!activeSection) {
			console.log('Hiçbir section aktif değil, bıçak sayfasını varsayılan olarak açıyorum...');
			const knivesSection = document.getElementById("knives-content");
			const knivesNavLink = document.querySelector('.nav-link[data-target="knives-content"]');
			
			if (knivesSection && knivesNavLink) {
				knivesSection.classList.add("active");
				knivesNavLink.classList.add("active");
			}
		}
	}, 500);
});