// j/main.js

// --- Функції для роботи з localStorage (перенесені з header.js) ---
function getStoredItems(key) {
    try {
        const items = localStorage.getItem(key);
        return items ? JSON.parse(items) : {};
    } catch (e) {
        console.error(`Помилка при отриманні з localStorage (${key}):`, e);
        return {};
    }
}

function saveItemsToStorage(key, items) {
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
        console.error(`Помилка при збереженні в localStorage (${key}):`, e);
    }
}

// --- Функція додавання товару в кошик (вже була тут) ---
function addToCart(productId, quantity = 1) {
    console.trace('addToCart викликана');
    const cartItems = getStoredItems('cartItems');

    cartItems[productId] = (cartItems[productId] || 0) + quantity;
    saveItemsToStorage('cartItems', cartItems);
    updateHeaderCounts(); // Виклик оновлення лічильника після додавання
    console.log(`Додано товар з ID: ${productId}, поточна кількість у кошику: ${cartItems[productId]}`);
}

// --- Функція оновлення лічильника в хедері (перенесена з header.js) ---
function updateHeaderCounts() {
    console.log("updateHeaderCounts: Виклик.");
    const cartCountSpan = document.getElementById('cart-count');
    const cartItems = getStoredItems('cartItems');
    const totalCartItems = Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);

    if (cartCountSpan) {
        cartCountSpan.textContent = totalCartItems;
        if (totalCartItems === 0) {
            cartCountSpan.classList.add('hidden');
        } else {
            cartCountSpan.classList.remove('hidden');
        }
    }
}


// --- DOMContentLoaded обробник (один єдиний для main.js) ---
document.addEventListener('DOMContentLoaded', () => {
    // Викликаємо updateHeaderCounts ОДИН РАЗ при завантаженні сторінки
    updateHeaderCounts();

    // --- Функціонал Scroll Reveal ---
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1
    });
    revealElements.forEach(element => {
        element.classList.add('reveal-hidden');
        observer.observe(element);
    });
    window.revealObserver = observer;

    // --- Обробник для кнопок "Додати в кошик" на product.html (сторінка одного товару) ---
    const productPageAddToCartBtn = document.getElementById('add-to-cart-btn');
    const productPageQuantityInput = document.getElementById('quantity-input');

    if (productPageAddToCartBtn && productPageQuantityInput) {
        productPageAddToCartBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const productId = parseInt(productPageAddToCartBtn.dataset.productId);
            const quantity = parseInt(productPageQuantityInput.value);

            if (!isNaN(productId) && quantity > 0) {
                addToCart(productId, quantity);
                alert(`Товар додано в кошик! (${quantity} шт.)`);
            } else {
                alert('Будь ласка, введіть дійсну кількість.');
            }
        });
    }

    // --- Функціонал кнопки "Назад до каталогу" на сторінці деталей товару ---
    const backToCatalogBtn = document.querySelector('.back-to-catalog-btn');
    if (backToCatalogBtn) {
        backToCatalogBtn.addEventListener('click', (event) => {
            event.preventDefault();
            window.history.back();
        });
    }

    // --- Анімація лічильника кошика в Header (можна видалити, якщо updateHeaderCounts вже робить це) ---
    // Якщо updateHeaderCounts() вже додає/видаляє клас 'hidden', то цей блок не потрібен.
    // Я залишу його закоментованим, бо updateHeaderCounts вже робить це.
    /*
    const cartItemCount = document.getElementById('cart-count');
    if (cartItemCount) {
        const updateCartCountVisibility = () => {
            const count = parseInt(cartItemCount.textContent || '0');
            if (count === 0) {
                cartItemCount.classList.add('hidden');
            } else {
                cartItemCount.classList.remove('hidden');
            }
        };
        // updateCartCountVisibility(); // Цей виклик вже є у DOMContentLoaded
    }
    */

    // --- Функціонал вибору кольору товару (для product-details, можливо, краще перенести в product.js) ---
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const currentColorNameSpan = document.getElementById('current-color-name');
    const fullProductImage = document.querySelector('.full-product-image');

    if (colorSwatches.length > 0 && currentColorNameSpan && fullProductImage) {
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                colorSwatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                const colorName = swatch.dataset.colorName;
                if (colorName) currentColorNameSpan.textContent = colorName;
                const imageUrl = swatch.dataset.imageUrl;
                if (imageUrl) fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
            });
        });

        const defaultActiveSwatch = document.querySelector('.color-swatch.active');
        if (defaultActiveSwatch) {
            const colorName = defaultActiveSwatch.dataset.colorName;
            const imageUrl = defaultActiveSwatch.dataset.imageUrl;
            if (colorName) currentColorNameSpan.textContent = colorName;
            if (imageUrl) fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
        } else if (colorSwatches.length > 0) {
            colorSwatches[0].classList.add('active');
            const colorName = colorSwatches[0].dataset.colorName;
            const imageUrl = colorSwatches[0].dataset.imageUrl;
            if (colorName) currentColorNameSpan.textContent = colorName;
            if (imageUrl) fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
        }
    }
});
