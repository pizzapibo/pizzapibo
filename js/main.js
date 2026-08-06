// Pibo - Main Application

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
    apiKey: "AIzaSyABWtZFepD4wLmbx1EhcVENfwDiOygSBSg",
    authDomain: "pibo-c87f1.firebaseapp.com",
    databaseURL: "https://pibo-c87f1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "pibo-c87f1",
    storageBucket: "pibo-c87f1.firebasestorage.app",
    messagingSenderId: "1000692640688",
    appId: "1:1000692640688:web:abe607c570bb48ac3b0475",
    measurementId: "G-NTRQRW9LZN"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==================== STATE ====================
let cart = JSON.parse(localStorage.getItem('pibo_cart')) || [];
let products = [];
let categories = [];
let settings = {};
let currentCategory = 'all';

// ==================== DOM ELEMENTS ====================
const preloader = document.querySelector('.preloader');
const navbar = document.querySelector('.navbar');
const cartBtn = document.querySelector('.cart-btn');
const cartSidebar = document.querySelector('.cart-sidebar');
const cartOverlay = document.querySelector('.cart-overlay');
const cartClose = document.querySelector('.cart-close');
const cartItemsContainer = document.querySelector('.cart-items');
const cartCount = document.querySelector('.cart-count');
const cartTotalPrice = document.querySelector('.cart-total-price');
const categoriesGrid = document.querySelector('.categories-grid');
const productsGrid = document.querySelector('.products-grid');
const orderItemsContainer = document.querySelector('.order-items');
const arModal = document.querySelector('.ar-modal');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Hide preloader after load
    setTimeout(() => {
        preloader.classList.add('hidden');
    }, 1500);

    // Load data from Firebase
    await loadSettings();
    await loadCategories();
    await loadProducts();

    // Setup event listeners
    setupEventListeners();
    setupScrollAnimations();
    updateCartUI();
    renderOrderItems();

    // Update contact info from settings
    updateContactInfo();
}

// ==================== DATA LOADING ====================
async function loadSettings() {
    try {
        const snapshot = await db.ref('settings').once('value');
        settings = snapshot.val() || {
            phone: '09140909878',
            whatsapp: '09140909878',
            telegram: '09140909878',
            about: 'پیتزا پیبو - بهترین طعم‌ها در دستان شما'
        };
    } catch (e) {
        console.error('Error loading settings:', e);
        settings = {
            phone: '09140909878',
            whatsapp: '09140909878',
            telegram: '09140909878',
            about: 'پیتزا پیبو - بهترین طعم‌ها در دستان شما'
        };
    }
}

async function loadCategories() {
    try {
        const snapshot = await db.ref('categories').once('value');
        const data = snapshot.val();
        if (data) {
            categories = Object.entries(data).map(([id, cat]) => ({ id, ...cat }));
        } else {
            // Default categories
            categories = [
                { id: 'pizza', name: 'پیتزا', icon: '🍕', count: 0 },
                { id: 'potato', name: 'سیب‌زمینی', icon: '🍟', count: 0 },
                { id: 'drink', name: 'نوشیدنی', icon: '🥤', count: 0 },
                { id: 'dessert', name: 'دسر', icon: '🍰', count: 0 }
            ];
            // Save defaults
            categories.forEach(cat => {
                db.ref(`categories/${cat.id}`).set({ name: cat.name, icon: cat.icon });
            });
        }
        renderCategories();
    } catch (e) {
        console.error('Error loading categories:', e);
    }
}

async function loadProducts() {
    try {
        const snapshot = await db.ref('products').once('value');
        const data = snapshot.val();
        if (data) {
            products = Object.entries(data).map(([id, prod]) => ({ id, ...prod }));
        } else {
            // Default sample products
            products = [
                {
                    id: 'p1',
                    name: 'پیتزا مخصوص پیبو',
                    description: 'ترکیبی از ژامبون، قارچ، فلفل دلمه‌ای و پنیر مخصوص',
                    price: 285000,
                    category: 'pizza',
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
                    modelGLB: '',
                    modelUSDZ: '',
                    available: true,
                    badge: 'پرفروش'
                },
                {
                    id: 'p2',
                    name: 'پیتزا پپرونی',
                    description: 'پپرونی تازه با پنیر موزارلا و سس مخصوص',
                    price: 265000,
                    category: 'pizza',
                    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
                    modelGLB: '',
                    modelUSDZ: '',
                    available: true,
                    badge: ''
                },
                {
                    id: 'p3',
                    name: 'سیب‌زمینی سرخ‌کرده',
                    description: 'سیب‌زمینی ترد با ادویه مخصوص پیبو',
                    price: 95000,
                    category: 'potato',
                    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400',
                    modelGLB: '',
                    modelUSDZ: '',
                    available: true,
                    badge: ''
                },
                {
                    id: 'p4',
                    name: 'نوشابه کلاسیک',
                    description: 'نوشابه گازدار سرد و خنک',
                    price: 35000,
                    category: 'drink',
                    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
                    modelGLB: '',
                    modelUSDZ: '',
                    available: true,
                    badge: ''
                },
                {
                    id: 'p5',
                    name: 'چیزکیک',
                    description: 'چیزکیک نیویورکی با سس توت‌فرنگی',
                    price: 125000,
                    category: 'dessert',
                    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400',
                    modelGLB: '',
                    modelUSDZ: '',
                    available: true,
                    badge: 'جدید'
                }
            ];
            products.forEach(prod => {
                db.ref(`products/${prod.id}`).set(prod);
            });
        }
        renderProducts();
        updateCategoryCounts();
    } catch (e) {
        console.error('Error loading products:', e);
    }
}

// ==================== RENDERING ====================
function renderCategories() {
    if (!categoriesGrid) return;

    const allCard = `
        <div class="category-card active" data-category="all">
            <div class="category-icon">🍽️</div>
            <div class="category-name">همه محصولات</div>
            <div class="category-count">${products.length} محصول</div>
        </div>
    `;

    const catsHtml = categories.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${cat.name}</div>
            <div class="category-count">${cat.count || 0} محصول</div>
        </div>
    `).join('');

    categoriesGrid.innerHTML = allCard + catsHtml;

    // Add click handlers
    categoriesGrid.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            categoriesGrid.querySelectorAll('.category-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentCategory = card.dataset.category;
            renderProducts();
        });
    });
}

function renderProducts() {
    if (!productsGrid) return;

    const filtered = currentCategory === 'all' 
        ? products 
        : products.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #888;">
                <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
                <h3>محصولی یافت نشد</h3>
                <p>در حال حاضر محصولی در این دسته‌بندی وجود ندارد</p>
            </div>
        `;
        return;
    }

    productsGrid.innerHTML = filtered.map((prod, index) => `
        <div class="product-card reveal" style="transition-delay: ${index * 0.1}s">
            <div class="product-image-wrapper">
                <img src="${prod.image}" alt="${prod.name}" class="product-image" loading="lazy">
                ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ''}
                ${(prod.modelGLB || prod.modelUSDZ) ? `
                    <button class="product-ar-btn" onclick="openAR('${prod.id}')">
                        👁️ مشاهده در AR
                    </button>
                ` : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${getCategoryName(prod.category)}</div>
                <h3 class="product-name">${prod.name}</h3>
                <p class="product-desc">${prod.description}</p>
                <div class="product-footer">
                    <div class="product-price">
                        ${formatPrice(prod.price)}
                        <span>تومان</span>
                    </div>
                    <button class="add-to-cart" onclick="addToCart('${prod.id}')" title="افزودن به سبد">
                        +
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Re-trigger scroll animations for new elements
    setTimeout(() => observeElements(), 100);
}

function getCategoryName(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
}

function updateCategoryCounts() {
    categories.forEach(cat => {
        cat.count = products.filter(p => p.category === cat.id).length;
    });
    renderCategories();
}

function updateContactInfo() {
    const phoneEl = document.querySelector('.contact-phone-number');
    const waEl = document.querySelector('.contact-whatsapp');
    const tgEl = document.querySelector('.contact-telegram');

    if (phoneEl) phoneEl.textContent = settings.phone || '09140909878';
    if (waEl) waEl.href = `https://wa.me/98${(settings.whatsapp || '09140909878').replace(/^0/, '')}`;
    if (tgEl) tgEl.href = `https://t.me/+98${(settings.telegram || '09140909878').replace(/^0/, '')}`;
}

// ==================== CART ====================
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: 1
        });
    }

    saveCart();
    updateCartUI();
    showToast(`${product.name} به سبد اضافه شد`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    renderOrderItems();
}

function updateQty(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }

    saveCart();
    updateCartUI();
    renderOrderItems();
}

function saveCart() {
    localStorage.setItem('pibo_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

    if (cartTotalPrice) {
        cartTotalPrice.textContent = formatPrice(totalPrice) + ' تومان';
    }

    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <h3>سبد خرید خالی است</h3>
                    <p>محصولاتی که دوست دارید را اضافه کنید</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatPrice(item.price)} تومان</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            `).join('');
        }
    }
}

function renderOrderItems() {
    if (!orderItemsContainer) return;

    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p style="text-align: center; color: #888;">سبد خرید خالی است</p>';
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    orderItemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <div>
                <strong>${item.name}</strong>
                <span style="color: #888; margin-right: 10px;">x${item.qty}</span>
            </div>
            <div style="color: #FF6B35; font-weight: 700;">
                ${formatPrice(item.price * item.qty)} تومان
            </div>
        </div>
    `).join('') + `
        <div class="order-total">
            <span>جمع کل:</span>
            <span style="color: #FF6B35;">${formatPrice(total)} تومان</span>
        </div>
    `;
}

// ==================== AR ====================
function openAR(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modalTitle = document.querySelector('.ar-modal-title');
    const modelViewer = document.querySelector('#ar-model-viewer');
    const arBtnPrimary = document.querySelector('.ar-btn-primary');
    const arBtnSecondary = document.querySelector('.ar-btn-secondary');

    if (modalTitle) modalTitle.textContent = `مشاهده ${product.name} در واقعیت افزوده`;

    if (modelViewer) {
        if (product.modelGLB) {
            modelViewer.src = product.modelGLB;
            modelViewer.setAttribute('ios-src', product.modelUSDZ || '');
        } else if (product.modelUSDZ) {
            // For iOS, use USDZ directly
            modelViewer.style.display = 'none';
        }
    }

    // Setup AR buttons
    if (arBtnPrimary) {
        if (product.modelGLB) {
            arBtnPrimary.style.display = 'flex';
            arBtnPrimary.onclick = () => {
                if (modelViewer) modelViewer.activateAR();
            };
        } else {
            arBtnPrimary.style.display = 'none';
        }
    }

    if (arBtnSecondary) {
        if (product.modelUSDZ) {
            arBtnSecondary.style.display = 'flex';
            arBtnSecondary.innerHTML = '📱 مشاهده در iOS (AR Quick Look)';
            arBtnSecondary.onclick = () => {
                const anchor = document.createElement('a');
                anchor.setAttribute('rel', 'ar');
                anchor.setAttribute('href', product.modelUSDZ);
                anchor.click();
            };
        } else if (product.modelGLB) {
            arBtnSecondary.style.display = 'flex';
            arBtnSecondary.innerHTML = '🤖 مشاهده در Android (Scene Viewer)';
            arBtnSecondary.onclick = () => {
                const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(product.modelGLB)}&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end;`;
                window.location.href = intent;
            };
        } else {
            arBtnSecondary.style.display = 'none';
        }
    }

    arModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAR() {
    arModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== ORDER ====================
function submitOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
        showToast('لطفاً ابتدا محصولاتی به سبد خرید اضافه کنید', 'error');
        return;
    }

    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const notes = document.getElementById('order-notes').value;

    if (!name || !phone || !address) {
        showToast('لطفاً تمام فیلدهای ضروری را پر کنید', 'error');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const order = {
        customer: { name, phone, address, notes },
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            qty: item.qty
        })),
        total,
        status: 'pending',
        timestamp: Date.now()
    };

    db.ref('orders').push(order)
        .then(() => {
            showToast('سفارش شما با موفقیت ثبت شد! 🎉');
            cart = [];
            saveCart();
            updateCartUI();
            renderOrderItems();
            document.getElementById('order-form').reset();
        })
        .catch(err => {
            console.error(err);
            showToast('خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.', 'error');
        });
}

// ==================== UTILITIES ====================
function formatPrice(price) {
    return price.toLocaleString('fa-IR');
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-icon">${type === 'success' ? '✓' : '!'}</div>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('active');
    });

    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Navbar scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Cart
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
        });
    }

    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCart);
    }

    // AR Modal
    document.querySelector('.ar-close')?.addEventListener('click', closeAR);
    arModal?.addEventListener('click', (e) => {
        if (e.target === arModal) closeAR();
    });

    // Order form
    document.getElementById('order-form')?.addEventListener('submit', submitOrder);

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
}

// ==================== SCROLL ANIMATIONS ====================
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    observeElements(observer);
}

function observeElements(existingObserver) {
    const observer = existingObserver || new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
        observer.observe(el);
    });
}
