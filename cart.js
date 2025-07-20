// j/cart.js

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceSpan = document.getElementById('cart-total-price');
    const cartSummaryDiv = document.getElementById('cart-summary');
    const clearCartButton = document.getElementById('clear-cart-button');

    // allProducts тепер глобально доступний з j/products-data.js

    function renderCartItems() {
        const cartItems = getStoredItems('cartItems');
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        if (Object.keys(cartItems).length === 0) {
            cartItemsContainer.innerHTML = `
                <p class="empty-cart-message" style="text-align: center; padding: 20px; font-size: 1.1em; color: #555;">
                    Ваш кошик порожній. <a href="category-page.html" class="button primary-button" style="margin-left: 10px;">Перейти до каталогу</a>
                </p>
            `;
            cartSummaryDiv.style.display = 'none';
            return;
        }

        cartSummaryDiv.style.display = 'block';

        for (const productId in cartItems) {
            const product = allProducts.find(p => p.id === parseInt(productId));
            const quantity = cartItems[productId];

            if (product) {
                const itemTotal = product.price * quantity;
                totalPrice += itemTotal;

                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                cartItemDiv.dataset.productId = productId;

                cartItemDiv.innerHTML = `
                    <div class="cart-item-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="cart-item-details">
                        <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
                        <p class="cart-item-price">${product.price.toFixed(2)} ₴ за шт.</p>
                        <div class="cart-item-quantity-control">
                            <button class="quantity-minus" data-id="${productId}">-</button>
                            <span class="quantity-value">${quantity}</span>
                            <button class="quantity-plus" data-id="${productId}">+</button>
                        </div>
                        <p class="cart-item-total">Всього: <span class="item-total-price">${itemTotal.toFixed(2)} ₴</span></p>
                    </div>
                    <button class="cart-item-remove-btn" data-id="${productId}">Видалити</button>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            }
        }

        cartTotalPriceSpan.textContent = `${totalPrice.toFixed(2)} ₴`;
        addCartItemEventListeners();
    }

    function addCartItemEventListeners() {
        document.querySelectorAll('.quantity-plus').forEach(button => {
            button.onclick = (event) => {
                const productId = parseInt(event.target.dataset.id);
                const cartItems = getStoredItems('cartItems');
                cartItems[productId]++;
                saveItemsToStorage('cartItems', cartItems);
                renderCartItems();
                updateHeaderCounts();
            };
        });

        document.querySelectorAll('.quantity-minus').forEach(button => {
            button.onclick = (event) => {
                const productId = parseInt(event.target.dataset.id);
                const cartItems = getStoredItems('cartItems');
                if (cartItems[productId] > 1) {
                    cartItems[productId]--;
                } else {
                    delete cartItems[productId];
                }
                saveItemsToStorage('cartItems', cartItems);
                renderCartItems();
                updateHeaderCounts();
            };
        });

        document.querySelectorAll('.cart-item-remove-btn').forEach(button => {
            button.onclick = (event) => {
                const productId = parseInt(event.target.dataset.id);
                const cartItems = getStoredItems('cartItems');
                delete cartItems[productId];
                saveItemsToStorage('cartItems', cartItems);
                renderCartItems();
                updateHeaderCounts();
            };
        });
    }

    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            if (window.confirm('Ви впевнені, що хочете очистити кошик?')) {
                saveItemsToStorage('cartItems', {});
                renderCartItems();
                updateHeaderCounts();
            }
        });
    }

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            alert('Функціонал оформлення замовлення ще не реалізовано.');
        });
    }

    renderCartItems();
});
