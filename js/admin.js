// Pibo Admin Panel

// ==================== SECURITY ====================
const ADMIN_PASSWORD_HASH = 'Arshiakamali2898'; // In production, use proper hashing
let isAuthenticated = sessionStorage.getItem('pibo_admin_auth') === 'true';

// ==================== DOM ELEMENTS ====================
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated) {
        showAdminPanel();
    } else {
        showLoginScreen();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Setup forms
    setupProductForm();
    setupCategoryForm();
    setupSettingsForm();

    // Load initial data
    loadAdminData();
});

function handleLogin(e) {
    e.preventDefault();
    const password = passwordInput.value;

    if (password === ADMIN_PASSWORD_HASH) {
        isAuthenticated = true;
        sessionStorage.setItem('pibo_admin_auth', 'true');
        showAdminPanel();
        loadAdminData();
    } else {
        loginError.textContent = 'رمز عبور اشتباه است!';
        passwordInput.value = '';
        passwordInput.focus();

        // Shake animation
        loginScreen.querySelector('.login-box').style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginScreen.querySelector('.login-box').style.animation = '';
        }, 500);
    }
}

function showLoginScreen() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
}

function showAdminPanel() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
}

function logout() {
    isAuthenticated = false;
    sessionStorage.removeItem('pibo_admin_auth');
    showLoginScreen();
}

// ==================== TAB SWITCHING ====================
function switchTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.admin-tab[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(`tab-${tabId}`)?.classList.add('active');

    // Refresh data for specific tabs
    if (tabId === 'orders') loadOrders();
    if (tabId === 'dashboard') loadDashboardStats();
}

// ==================== DATA LOADING ====================
let adminProducts = [];
let adminCategories = [];
let adminOrders = [];
let adminSettings = {};

async function loadAdminData() {
    await Promise.all([
        loadAdminProducts(),
        loadAdminCategories(),
        loadAdminSettings(),
        loadOrders(),
        loadDashboardStats()
    ]);
}

async function loadAdminProducts() {
    try {
        const snapshot = await db.ref('products').once('value');
        const data = snapshot.val() || {};
        adminProducts = Object.entries(data).map(([id, p]) => ({ id, ...p }));
        renderAdminProducts();
    } catch (e) {
        console.error(e);
    }
}

async function loadAdminCategories() {
    try {
        const snapshot = await db.ref('categories').once('value');
        const data = snapshot.val() || {};
        adminCategories = Object.entries(data).map(([id, c]) => ({ id, ...c }));
        renderAdminCategories();
        updateCategorySelect();
    } catch (e) {
        console.error(e);
    }
}

async function loadAdminSettings() {
    try {
        const snapshot = await db.ref('settings').once('value');
        adminSettings = snapshot.val() || {};
        fillSettingsForm();
    } catch (e) {
        console.error(e);
    }
}

async function loadOrders() {
    try {
        const snapshot = await db.ref('orders').once('value');
        const data = snapshot.val() || {};
        adminOrders = Object.entries(data).map(([id, o]) => ({ id, ...o })).sort((a, b) => b.timestamp - a.timestamp);
        renderOrders();
    } catch (e) {
        console.error(e);
    }
}

async function loadDashboardStats() {
    try {
        const productsSnap = await db.ref('products').once('value');
        const ordersSnap = await db.ref('orders').once('value');

        const productsCount = productsSnap.numChildren();
        const ordersData = ordersSnap.val() || {};
        const ordersList = Object.values(ordersData);

        const totalRevenue = ordersList.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = ordersList.filter(o => o.status === 'pending').length;
        const completedOrders = ordersList.filter(o => o.status === 'completed').length;

        document.getElementById('stat-products').textContent = productsCount;
        document.getElementById('stat-orders').textContent = ordersList.length;
        document.getElementById('stat-revenue').textContent = formatPrice(totalRevenue) + ' تومان';
        document.getElementById('stat-pending').textContent = pendingOrders;
    } catch (e) {
        console.error(e);
    }
}

// ==================== PRODUCTS MANAGEMENT ====================
function renderAdminProducts() {
    const container = document.getElementById('admin-products-list');
    if (!container) return;

    if (adminProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">محصولی وجود ندارد</p>';
        return;
    }

    container.innerHTML = adminProducts.map(prod => `
        <div class="admin-item">
            <img src="${prod.image}" alt="${prod.name}" class="admin-item-img">
            <div class="admin-item-info">
                <h4>${prod.name}</h4>
                <p>${getCategoryName(prod.category)} | ${formatPrice(prod.price)} تومان</p>
                <span class="badge ${prod.available ? 'badge-success' : 'badge-danger'}">
                    ${prod.available ? 'فعال' : 'غیرفعال'}
                </span>
            </div>
            <div class="admin-item-actions">
                <button class="btn-icon btn-edit" onclick="editProduct('${prod.id}')">✏️</button>
                <button class="btn-icon btn-delete" onclick="deleteProduct('${prod.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function setupProductForm() {
    const form = document.getElementById('product-form');
    const cancelBtn = document.getElementById('cancel-product');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('product-id').value;
            const product = {
                name: document.getElementById('prod-name').value,
                description: document.getElementById('prod-desc').value,
                price: parseInt(document.getElementById('prod-price').value),
                category: document.getElementById('prod-category').value,
                image: document.getElementById('prod-image').value,
                modelGLB: document.getElementById('prod-glb').value,
                modelUSDZ: document.getElementById('prod-usdz').value,
                badge: document.getElementById('prod-badge').value,
                available: document.getElementById('prod-available').checked
            };

            try {
                if (id) {
                    await db.ref(`products/${id}`).update(product);
                    showAdminToast('محصول با موفقیت بروزرسانی شد');
                } else {
                    await db.ref('products').push(product);
                    showAdminToast('محصول جدید اضافه شد');
                }

                resetProductForm();
                loadAdminProducts();
            } catch (err) {
                showAdminToast('خطا در ذخیره محصول', 'error');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetProductForm);
    }
}

function editProduct(id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;

    document.getElementById('product-id').value = id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-desc').value = product.description || '';
    document.getElementById('prod-price').value = product.price;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-image').value = product.image;
    document.getElementById('prod-glb').value = product.modelGLB || '';
    document.getElementById('prod-usdz').value = product.modelUSDZ || '';
    document.getElementById('prod-badge').value = product.badge || '';
    document.getElementById('prod-available').checked = product.available !== false;

    document.getElementById('product-form-title').textContent = 'ویرایش محصول';
    document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(id) {
    if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) return;

    try {
        await db.ref(`products/${id}`).remove();
        showAdminToast('محصول حذف شد');
        loadAdminProducts();
    } catch (err) {
        showAdminToast('خطا در حذف محصول', 'error');
    }
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-form-title').textContent = 'افزودن محصول جدید';
    document.getElementById('prod-available').checked = true;
}

// ==================== CATEGORIES MANAGEMENT ====================
function renderAdminCategories() {
    const container = document.getElementById('admin-categories-list');
    if (!container) return;

    container.innerHTML = adminCategories.map(cat => `
        <div class="admin-item">
            <div class="admin-item-icon">${cat.icon}</div>
            <div class="admin-item-info">
                <h4>${cat.name}</h4>
                <p>شناسه: ${cat.id}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn-icon btn-edit" onclick="editCategory('${cat.id}')">✏️</button>
                <button class="btn-icon btn-delete" onclick="deleteCategory('${cat.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function updateCategorySelect() {
    const select = document.getElementById('prod-category');
    if (!select) return;

    select.innerHTML = adminCategories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

function setupCategoryForm() {
    const form = document.getElementById('category-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('cat-id').value.trim();
            const name = document.getElementById('cat-name').value.trim();
            const icon = document.getElementById('cat-icon').value.trim();

            if (!id || !name) {
                showAdminToast('لطفاً همه فیلدها را پر کنید', 'error');
                return;
            }

            try {
                await db.ref(`categories/${id}`).set({ name, icon });
                showAdminToast('دسته‌بندی ذخیره شد');
                document.getElementById('category-form').reset();
                loadAdminCategories();
            } catch (err) {
                showAdminToast('خطا در ذخیره دسته‌بندی', 'error');
            }
        });
    }
}

async function deleteCategory(id) {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;

    try {
        await db.ref(`categories/${id}`).remove();
        showAdminToast('دسته‌بندی حذف شد');
        loadAdminCategories();
    } catch (err) {
        showAdminToast('خطا در حذف دسته‌بندی', 'error');
    }
}

function editCategory(id) {
    const cat = adminCategories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('cat-id').value = cat.id;
    document.getElementById('cat-name').value = cat.name;
    document.getElementById('cat-icon').value = cat.icon;
}

// ==================== ORDERS MANAGEMENT ====================
function renderOrders() {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;

    if (adminOrders.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">سفارشی وجود ندارد</p>';
        return;
    }

    container.innerHTML = adminOrders.map(order => {
        const date = new Date(order.timestamp).toLocaleString('fa-IR');
        const statusClass = order.status === 'completed' ? 'badge-success' : 
                           order.status === 'cancelled' ? 'badge-danger' : 'badge-warning';
        const statusText = order.status === 'completed' ? 'تکمیل شده' : 
                          order.status === 'cancelled' ? 'لغو شده' : 'در انتظار';

        return `
            <div class="admin-order-card">
                <div class="order-header">
                    <div>
                        <strong>سفارش #${order.id.slice(-6)}</strong>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    <span style="color: #888; font-size: 0.85rem;">${date}</span>
                </div>
                <div class="order-customer">
                    <p><strong>نام:</strong> ${order.customer?.name || '-'}</p>
                    <p><strong>تلفن:</strong> ${order.customer?.phone || '-'}</p>
                    <p><strong>آدرس:</strong> ${order.customer?.address || '-'}</p>
                    ${order.customer?.notes ? `<p><strong>توضیحات:</strong> ${order.customer.notes}</p>` : ''}
                </div>
                <div class="order-items">
                    ${order.items?.map(item => `
                        <div class="order-item-row">
                            <span>${item.name} x${item.qty}</span>
                            <span>${formatPrice(item.price * item.qty)} تومان</span>
                        </div>
                    `).join('') || ''}
                </div>
                <div class="order-footer">
                    <strong>جمع: ${formatPrice(order.total)} تومان</strong>
                    <div class="order-actions">
                        ${order.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order.id}', 'completed')">✓ تکمیل</button>
                            <button class="btn btn-sm btn-danger" onclick="updateOrderStatus('${order.id}', 'cancelled')">✕ لغو</button>
                        ` : ''}
                        <button class="btn btn-sm btn-secondary" onclick="deleteOrder('${order.id}')">🗑️ حذف</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateOrderStatus(id, status) {
    try {
        await db.ref(`orders/${id}/status`).set(status);
        showAdminToast(`وضعیت سفارش ${status === 'completed' ? 'تکمیل' : 'لغو'} شد`);
        loadOrders();
        loadDashboardStats();
    } catch (err) {
        showAdminToast('خطا در بروزرسانی وضعیت', 'error');
    }
}

async function deleteOrder(id) {
    if (!confirm('آیا از حذف این سفارش اطمینان دارید؟')) return;

    try {
        await db.ref(`orders/${id}`).remove();
        showAdminToast('سفارش حذف شد');
        loadOrders();
        loadDashboardStats();
    } catch (err) {
        showAdminToast('خطا در حذف سفارش', 'error');
    }
}

// ==================== SETTINGS ====================
function fillSettingsForm() {
    document.getElementById('set-phone').value = adminSettings.phone || '09140909878';
    document.getElementById('set-whatsapp').value = adminSettings.whatsapp || '09140909878';
    document.getElementById('set-telegram').value = adminSettings.telegram || '09140909878';
    document.getElementById('set-about').value = adminSettings.about || '';
    document.getElementById('set-qr').value = adminSettings.qrCode || '';
}

function setupSettingsForm() {
    const form = document.getElementById('settings-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const settings = {
                phone: document.getElementById('set-phone').value,
                whatsapp: document.getElementById('set-whatsapp').value,
                telegram: document.getElementById('set-telegram').value,
                about: document.getElementById('set-about').value,
                qrCode: document.getElementById('set-qr').value
            };

            try {
                await db.ref('settings').set(settings);
                showAdminToast('تنظیمات با موفقیت ذخیره شد');
            } catch (err) {
                showAdminToast('خطا در ذخیره تنظیمات', 'error');
            }
        });
    }
}

// ==================== UTILITIES ====================
function formatPrice(price) {
    return price?.toLocaleString('fa-IR') || '0';
}

function getCategoryName(catId) {
    const cat = adminCategories.find(c => c.id === catId);
    return cat ? cat.name : catId;
}

function showAdminToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 30px;
        left: 30px;
        background: ${type === 'success' ? '#22C55E' : '#EF4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
