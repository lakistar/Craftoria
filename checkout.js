// j/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    const checkoutCartItemsContainer = document.getElementById('checkout-cart-items');
    const checkoutTotalPriceElement = document.getElementById('checkout-total-price');
    const checkoutForm = document.getElementById('checkout-form');

    let cartItems = getStoredItems('cartItems');
    let totalCartPrice = 0;

    // Функція для відображення товарів у підсумку замовлення
    function renderCheckoutSummary() {
        checkoutCartItemsContainer.innerHTML = '';
        totalCartPrice = 0;

        // Перевіряємо, чи є товари в кошику
        const hasItems = Object.keys(cartItems).some(productId => cartItems[productId] > 0);

        if (!hasItems) {
            checkoutCartItemsContainer.innerHTML = '<p class="empty-checkout-message">Ваш кошик порожній. <a href="category-page.html">Перейти до каталогу</a></p>';
            checkoutForm.style.display = 'none'; // Приховати форму, якщо кошик порожній
            checkoutTotalPriceElement.textContent = '0.00 ₴';
            return;
        } else {
            checkoutForm.style.display = 'block'; // Показати форму, якщо є товари
        }

        for (const productId in cartItems) {
            const quantity = cartItems[productId];
            if (quantity > 0) {
                const product = allProducts.find(p => p.id === parseInt(productId));
                if (product) {
                    const itemTotal = product.price * quantity;
                    totalCartPrice += itemTotal;

                    const itemElement = document.createElement('div');
                    itemElement.classList.add('checkout-summary-item');
                    itemElement.innerHTML = `
                        <img src="${product.image}" alt="${product.name}" class="checkout-item-image">
                        <div class="checkout-item-details">
                            <p class="checkout-item-name">${product.name}</p>
                            <p class="checkout-item-qty-price">${quantity} x ${product.price.toFixed(2)} ₴</p>
                        </div>
                        <p class="checkout-item-total">${itemTotal.toFixed(2)} ₴</p>
                    `;
                    checkoutCartItemsContainer.appendChild(itemElement);
                }
            }
        }
        checkoutTotalPriceElement.textContent = totalCartPrice.toFixed(2) + ' ₴';
    }

    // Обробник відправки форми
    checkoutForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Запобігаємо стандартній відправці форми

        // Проста валідація форми
        const fullName = document.getElementById('full-name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

        if (!fullName || !phone || !email || !address) {
            alert('Будь ласка, заповніть всі обов\'язкові поля.');
            return;
        }

        // Імітація успішного оформлення замовлення
        console.log('Замовлення оформлено!');
        console.log('Дані клієнта:', { fullName, phone, email, address, paymentMethod });
        console.log('Товари в замовленні:', cartItems);
        console.log('Загальна сума:', totalCartPrice);

        // Очищаємо кошик після успішного замовлення
        saveItemsToStorage('cartItems', {});
        updateHeaderCounts(); // Оновлюємо лічильник товарів у хедері

        // Відображаємо повідомлення про успішне замовлення
        displayOrderConfirmation();
    });

    function displayOrderConfirmation() {
        const mainContent = document.querySelector('.checkout-page-main .container');
        mainContent.innerHTML = `
            <div class="order-confirmation-message">
                <h1>Дякуємо за Ваше замовлення!</h1>
                <p>Ваше замовлення успішно оформлено. Ми зв'яжемося з Вами найближчим часом для підтвердження деталей.</p>
                <p>Номер Вашого замовлення: <strong>#${Math.floor(Math.random() * 1000000)}</strong></p>
                <a href="index.html" class="button primary-button">Повернутися на головну</a>
                <a href="category-page.html" class="button secondary-button">Продовжити покупки</a>
            </div>
        `;
    }

    // Ініціалізуємо підсумок замовлення при завантаженні сторінки
    renderCheckoutSummary();
});
