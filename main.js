// j/main.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Функціонал Scroll Reveal ---
    // Вибираємо всі елементи з класом 'reveal'
    const revealElements = document.querySelectorAll('.reveal');

    // Створюємо Intersection Observer
    // В Intersection Observer API, IntersectionObserverOptions та threshold є ключовими
    // rootMargin: дозволяє розширити або звузити bounding box кореневого елемента (viewport за замовчуванням).
    // threshold: поріг спрацювання (від 0 до 1), коли елемент вважається "перетнутим"
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Якщо елемент перетинає viewport (тобто стає видимим)
                entry.target.classList.add('is-visible'); // Це наш головний клас, який запускає анімацію
                entry.target.classList.add('reveal-visible'); // Додатковий клас, якщо використовуємо reveal-hidden/reveal-visible
                // Припиняємо спостереження за цим елементом, щоб анімація спрацювала лише один раз
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px', // Без відступу від країв viewport
        threshold: 0.1 // Спрацює, коли 10% елемента буде видно
    });

    // Для кожного елемента, який потрібно анімувати, який існує при завантаженні DOM
    revealElements.forEach(element => {
        // Додаємо клас reveal-hidden для початкового прихованого стану.
        // Цей клас повинен бути в CSS і робити елемент невидимим.
        element.classList.add('reveal-hidden');
        // Починаємо спостерігати за елементом
        observer.observe(element);
    });

    // Зберігаємо observer у window, щоб його можна було використовувати для динамічно доданих елементів
    // наприклад, у renderCheckoutSummary у checkout.js
    window.revealObserver = observer;


    // --- Анімація лічильника кошика в Header ---
    const cartItemCount = document.getElementById('cart-count');
    if (cartItemCount) {
        const updateCartCountVisibility = () => {
            // Перевіряємо, чи текст є числом, інакше default до 0
            const count = parseInt(cartItemCount.textContent || '0');
            if (count === 0) {
                cartItemCount.classList.add('hidden'); // Додаємо клас, який ховає елемент (display: none або opacity: 0)
            } else {
                cartItemCount.classList.remove('hidden');
            }
        };
        updateCartCountVisibility(); // Перевірити при завантаженні

        // Важливо: Якщо ви оновлюєте кількість товарів у кошику через JavaScript
        // (наприклад, додаючи товар), вам потрібно викликати updateCartCountVisibility()
        // щоразу після оновлення кількості.
        // Приклад:
        // document.addEventListener('cartUpdated', updateCartCountVisibility);
        // Або викликати її безпосередньо у вашій функції оновлення кошика.
    }


    // --- Функціонал вибору кольору товару (для сторінки product-details) ---
    // Перевіряємо, чи існують ці елементи на сторінці, перш ніж додавати обробники подій
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const currentColorNameSpan = document.getElementById('current-color-name');
    const fullProductImage = document.querySelector('.full-product-image'); // Зображення товару

    if (colorSwatches.length > 0 && currentColorNameSpan && fullProductImage) {
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                // Видаляємо клас 'active' з усіх свотчів
                colorSwatches.forEach(s => s.classList.remove('active'));

                // Додаємо клас 'active' до клікнутого свотчу
                swatch.classList.add('active');

                // Оновлюємо назву поточного кольору
                const colorName = swatch.dataset.colorName; // Припускаємо, що у вас є data-color-name="Назва"
                if (colorName) { // Перевірка на існування data-атрибуту
                    currentColorNameSpan.textContent = colorName;
                }

                // Оновлюємо зображення товару (якщо воно змінюється залежно від кольору)
                const imageUrl = swatch.dataset.imageUrl; // Припускаємо, що у вас є data-image-url="шлях/до/зображення.jpg"
                if (imageUrl) {
                    fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
                }
            });
        });

        // Встановлюємо активний колір і зображення за замовчуванням при завантаженні сторінки
        const defaultActiveSwatch = document.querySelector('.color-swatch.active');
        if (defaultActiveSwatch) {
            const colorName = defaultActiveSwatch.dataset.colorName;
            const imageUrl = defaultActiveSwatch.dataset.imageUrl;
            if (colorName) currentColorNameSpan.textContent = colorName;
            if (imageUrl) fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
        } else if (colorSwatches.length > 0) {
            // Якщо активний не встановлено, зробимо перший активним за замовчуванням
            colorSwatches[0].classList.add('active');
            const colorName = colorSwatches[0].dataset.colorName;
            const imageUrl = colorSwatches[0].dataset.imageUrl;
            if (colorName) currentColorNameSpan.textContent = colorName;
            if (imageUrl) fullProductImage.style.backgroundImage = `url('${imageUrl}')`;
        }
    }

    // --- Функціонал кнопки "Додати в кошик" на сторінці деталей товару ---
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    const quantityInput = document.querySelector('.quantity-input');

    if (addToCartBtn && quantityInput) {
        addToCartBtn.addEventListener('click', () => {
            const productId = addToCartBtn.dataset.productId; // Припускаємо, що ви додали data-product-id до кнопки
            const quantity = parseInt(quantityInput.value);

            if (productId && quantity > 0) {
                // Тут має бути логіка додавання товару в кошик
                // Це може бути виклик функції з вашого cart.js або прямо тут
                // Приклад:
                // addToCart(productId, quantity); // Якщо у вас є така функція

                // Для демонстрації просто виведемо в консоль
                console.log(`Додано в кошик: Product ID: ${productId}, Кількість: ${quantity}`);

                // Можливо, оновлення UI (наприклад, кількості товарів у кошику в хедері)
                if (cartItemCount) {
                    // Це дуже спрощений приклад, потрібно використовувати реальну логіку кошика
                    // наприклад, завантажувати кількість з localStorage або з API
                    let currentCartCount = parseInt(cartItemCount.textContent || '0');
                    cartItemCount.textContent = currentCartCount + quantity;
                    // Оновити видимість лічильника
                    if (window.updateCartCountVisibility) { // Перевірка, чи функція існує
                        window.updateCartCountVisibility();
                    } else {
                        // Якщо функція не була оголошена глобально, можна дублювати логіку
                        if (currentCartCount + quantity > 0) {
                             cartItemCount.classList.remove('hidden');
                        }
                    }
                }

                // Додаткова логіка: сповіщення користувача, перенаправлення тощо.
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
            event.preventDefault(); // Запобігаємо стандартній дії посилання
            // Повернення на попередню сторінку в історії браузера
            window.history.back();
            // Або перехід на певну сторінку, наприклад, products.html
            // window.location.href = 'products.html';
        });
    }

    // --- Обробка кліків на "Додати в кошик" з карток товарів (якщо ці кнопки мають клас .add-to-cart-card) ---
    // Якщо у вас є кнопки "Додати в кошик" прямо на картках товарів (на index.html, category.html)
    // і вони мають клас, наприклад, .add-to-cart-card (не .add-to-cart-btn, який для сторінки продукту)
    const addToCartCardButtons = document.querySelectorAll('.product-card-actions .primary-button');

    addToCartCardButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Запобігаємо переходу за посиланням, якщо кнопка це посилання
            const productId = button.dataset.productId; // Переконайтеся, що data-product-id є на кнопці

            if (productId) {
                // Тут викликаємо вашу логіку додавання в кошик з cart.js (якщо він є)
                // Наприклад: addToCart(productId, 1); // Додаємо 1 одиницю
                console.log(`Додано товар з картки: Product ID: ${productId}, Кількість: 1`);
                alert('Товар додано в кошик!');

                // Оновлення лічильника кошика в хедері
                if (cartItemCount) {
                    let currentCartCount = parseInt(cartItemCount.textContent || '0');
                    cartItemCount.textContent = currentCartCount + 1;
                    if (window.updateCartCountVisibility) {
                        window.updateCartCountVisibility();
                    }
                }
            }
        });
    });

    // --- Функціонал для сторінки кошика (checkout.html та cart.html) ---
    // Цей код варто перенести в окремий cart.js або checkout.js, але для прикладу я залишу тут
    // Якщо він вже є у ваших окремих файлах, то цей блок можна видалити з main.js

    // Функції для роботи з кошиком (припускаємо, що вони десь визначені, або будемо їх писати тут)
    function updateCartItemQuantity(productId, newQuantity) {
        // Логіка оновлення кількості в кошику (наприклад, у localStorage або через API)
        console.log(`Оновлено кількість для ${productId} до ${newQuantity}`);
        // Після оновлення потрібно перерахувати суму і оновити UI
        renderCartSummary(); // Викликаємо функцію рендерингу підсумку
    }

    function removeCartItem(productId) {
        // Логіка видалення товару з кошика
        console.log(`Видалено товар ${productId}`);
        // Після видалення потрібно перерахувати суму і оновити UI
        renderCartSummary(); // Викликаємо функцію рендерингу підсумку
    }

    function renderCartSummary() {
        // Ця функція повинна завантажувати дані кошика і рендерити їх
        // Це плейсхолдер, вам потрібно буде реалізувати це на основі ваших даних кошика
        const cartItemsContainer = document.querySelector('.cart-items-container');
        const checkoutCartItemsContainer = document.querySelector('.checkout-cart-items');
        const cartTotalPriceElement = document.getElementById('cart-total-price');
        const emptyCartMessage = document.querySelector('.empty-cart-message');

        if (cartItemsContainer || checkoutCartItemsContainer) {
            // Припускаємо, що у вас є глобальний об'єкт `cartItems` або функція `getCartItems()`
            const itemsInCart = [ /* Завантажити реальні товари з кошика */ ]; // Це має бути ваші реальні дані кошика

            if (cartItemsContainer) cartItemsContainer.innerHTML = ''; // Очищаємо попередній вміст
            if (checkoutCartItemsContainer) checkoutCartItemsContainer.innerHTML = '';

            let totalCartPrice = 0;

            if (itemsInCart.length === 0) {
                if (emptyCartMessage) emptyCartMessage.classList.remove('hidden');
                if (cartItemsContainer) cartItemsContainer.classList.add('hidden'); // Приховати контейнер, якщо порожній
                if (checkoutCartItemsContainer) checkoutCartItemsContainer.classList.add('hidden');
            } else {
                if (emptyCartMessage) emptyCartMessage.classList.add('hidden');
                if (cartItemsContainer) cartItemsContainer.classList.remove('hidden');
                if (checkoutCartItemsContainer) checkoutCartItemsContainer.classList.remove('hidden');

                itemsInCart.forEach(item => {
                    const itemTotal = item.price * item.quantity;
                    totalCartPrice += itemTotal;

                    // Рендеринг для cart.html
                    if (cartItemsContainer) {
                        const cartItemElement = document.createElement('div');
                        cartItemElement.classList.add('cart-item', 'reveal', 'slide-up'); // Додаємо reveal класи
                        cartItemElement.innerHTML = `
                            <div class="cart-item-image">
                                <img src="${item.image}" alt="${item.name}">
                            </div>
                            <div class="cart-item-details">
                                <h3><a href="product-details.html?id=${item.id}">${item.name}</a></h3>
                                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                                <div class="cart-item-quantity-control">
                                    <button class="decrease-quantity" data-product-id="${item.id}">-</button>
                                    <span class="quantity-value">${item.quantity}</span>
                                    <button class="increase-quantity" data-product-id="${item.id}">+</button>
                                </div>
                            </div>
                            <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                            <button class="cart-item-remove-btn" data-product-id="${item.id}">Видалити</button>
                        `;
                        cartItemsContainer.appendChild(cartItemElement);

                        // Додаємо елементи в observer, якщо вони були динамічно додані
                        if (window.revealObserver) {
                            cartItemElement.classList.add('reveal-hidden'); // Забезпечити початковий прихований стан
                            window.revealObserver.observe(cartItemElement);
                        }
                    }

                    // Рендеринг для checkout.html
                    if (checkoutCartItemsContainer) {
                        const checkoutItemElement = document.createElement('div');
                        checkoutItemElement.classList.add('checkout-summary-item', 'reveal', 'slide-up'); // Додаємо reveal класи
                        checkoutItemElement.innerHTML = `
                            <img src="${item.image}" alt="${item.name}" class="checkout-item-image">
                            <div class="checkout-item-details">
                                <div class="checkout-item-name">${item.name}</div>
                                <div class="checkout-item-price-qty">
                                    $${item.price.toFixed(2)} x ${item.quantity}
                                </div>
                            </div>
                            <div class="checkout-item-total">$${itemTotal.toFixed(2)}</div>
                        `;
                        checkoutCartItemsContainer.appendChild(checkoutItemElement);

                         // Додаємо елементи в observer, якщо вони були динамічно додані
                        if (window.revealObserver) {
                            checkoutItemElement.classList.add('reveal-hidden'); // Забезпечити початковий прихований стан
                            window.revealObserver.observe(checkoutItemElement);
                        }
                    }
                });

                if (cartTotalPriceElement) {
                    cartTotalPriceElement.textContent = `$${totalCartPrice.toFixed(2)}`;
                }

                // Додаємо обробники подій для кнопок кількості та видалення в cart.html
                if (cartItemsContainer) {
                    cartItemsContainer.querySelectorAll('.decrease-quantity').forEach(button => {
                        button.addEventListener('click', (event) => {
                            const productId = event.target.dataset.productId;
                            // Реалізуйте логіку зменшення кількості
                            // updateCartItemQuantity(productId, currentQuantity - 1);
                            alert(`Зменшити кількість для ${productId}`);
                        });
                    });

                    cartItemsContainer.querySelectorAll('.increase-quantity').forEach(button => {
                        button.addEventListener('click', (event) => {
                            const productId = event.target.dataset.productId;
                            // Реалізуйте логіку збільшення кількості
                            // updateCartItemQuantity(productId, currentQuantity + 1);
                            alert(`Збільшити кількість для ${productId}`);
                        });
                    });

                    cartItemsContainer.querySelectorAll('.cart-item-remove-btn').forEach(button => {
                        button.addEventListener('click', (event) => {
                            const productId = event.target.dataset.productId;
                            // Реалізуйте логіку видалення
                            // removeCartItem(productId);
                            alert(`Видалити товар ${productId}`);
                        });
                    });
                }
            }
        }
    }

    // Викликаємо рендеринг кошика при завантаженні для сторінок cart.html та checkout.html
    // Важливо: це лише "мокап". Вам потрібно підключити реальну логіку кошика.
    // Якщо у вас є окремий cart.js, який це робить, то цей виклик тут не потрібен.
    // renderCartSummary();
});
