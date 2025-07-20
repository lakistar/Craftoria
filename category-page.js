// j/category-page.js

// Переконайтеся, що allProducts, getStoredItems, saveItemsToStorage, addToCart
// визначені в products-data.js та main.js відповідно і підключені ПЕРЕД цим скриптом в HTML.

document.addEventListener('DOMContentLoaded', () => {
    const categoryTitleElement = document.getElementById('category-title');
    const productGrid = document.getElementById('category-product-grid');

    // Функція для отримання параметра з URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let initialCategoryParam = getUrlParameter('category');
    // Встановлюємо 'all' як категорію за замовчуванням, якщо параметр відсутній
    let currentCategoryFilter = initialCategoryParam || 'all';

    // Мапа для відображення назв категорій
    const categoryMap = {
        'all': 'Всі товари',
        'beads': 'Бісер та Бісероплетіння',
        'threads': 'Нитки та Пряжа',
        'fabrics': 'Тканини та Основи',
        'decor': 'Фурнітура та Декор',
        'kits': 'Набори для Рукоділля',
        'tools': 'Інструменти та Допоміжні Матеріали'
    };

    // Встановлюємо початковий заголовок сторінки
    categoryTitleElement.textContent = `Каталог: ${categoryMap[currentCategoryFilter] || 'Всі товари'}`;

    // Встановлюємо початковий стан радіокнопок фільтрації категорій
    const initialCategoryRadio = document.getElementById(`cat-${currentCategoryFilter}`);
    if (initialCategoryRadio) {
        initialCategoryRadio.checked = true;
    }

    // Змінна для зберігання продуктів, що відображаються
    let displayedProducts = [];

    // Функція рендерингу товарів у сітці
    function renderProducts(productsToRender) {
        productGrid.innerHTML = ''; // Очищаємо сітку перед рендерингом

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; width: 100%;">Товарів за вибраними критеріями не знайдено.</p>';
            return;
        }

        // Отримуємо поточний стан кошика для відображення статусу "В кошику"
        const cartItems = getStoredItems('cartItems');

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

            // Перевіряємо, чи товар є в кошику і його кількість > 0
            const isInCart = cartItems[product.id] && cartItems[product.id] > 0;

            productCard.innerHTML = `
                <a href="product.html?id=${product.id}" class="product-link">
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <h3>${product.name}</h3>
                    <p class="product-price">${product.price.toFixed(2)} ₴</p>
                </a>
                <div class="product-card-actions">
                    <button class="button primary-button add-to-cart-btn" data-product-id="${product.id}">
                        ${isInCart ? 'В кошику' : 'Додати до кошика'}
                    </button>
                </div>
            `;
            productGrid.appendChild(productCard);
        });

        // Делегування подій для кнопок "Додати до кошика"
        // Обробник додається до батьківського елемента (productGrid),
        // і перевіряє, чи клік був на кнопці з класом 'add-to-cart-btn'
        productGrid.addEventListener('click', (event) => {
            const targetButton = event.target.closest('.add-to-cart-btn'); // Знаходимо найближчу кнопку
            if (targetButton) {
                event.preventDefault(); // Запобігаємо стандартній поведінці кнопки
                const productId = parseInt(targetButton.dataset.productId);

                // Використовуємо глобальну функцію addToCart з j/main.js
                // Вона сама оновить localStorage та лічильник у хедері
                addToCart(productId);

                // Оновлюємо текст кнопки на "В кошику"
                targetButton.textContent = 'В кошику';
            }
        });
    }

    // Функція застосування фільтрів та сортування
    function applyFiltersAndSort() {
        // Отримуємо вибрану категорію з радіокнопок
        const selectedCategoryRadio = document.querySelector('input[name="category-filter"]:checked');
        currentCategoryFilter = selectedCategoryRadio ? selectedCategoryRadio.value : 'all';

        // Оновлюємо заголовок сторінки відповідно до вибраної категорії
        categoryTitleElement.textContent = `Каталог: ${categoryMap[currentCategoryFilter] || 'Всі товари'}`;

        let filtered = allProducts.filter(product => {
            // Фільтрація за категорією
            if (currentCategoryFilter !== 'all' && product.category !== currentCategoryFilter) {
                return false;
            }

            // Фільтрація за ціною
            const priceFrom = parseFloat(document.getElementById('price-from').value) || 0;
            const priceTo = parseFloat(document.getElementById('price-to').value) || Infinity;
            if (product.price < priceFrom || product.price > priceTo) {
                return false;
            }

            // Фільтрація за кольором
            const selectedColors = Array.from(document.querySelectorAll('.color-filter-list input[type="checkbox"]:checked'))
                                             .map(cb => cb.value);
            if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                return false;
            }

            // Фільтрація за матеріалом
            const selectedMaterials = Array.from(document.querySelectorAll('.material-filter-list input[type="checkbox"]:checked'))
                                                     .map(cb => cb.value);
            if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) {
                return false;
            }

            // Фільтрація за виробником
            const selectedManufacturer = document.getElementById('manufacturer-filter').value;
            if (selectedManufacturer && product.manufacturer !== selectedManufacturer) {
                return false;
            }

            return true; // Якщо товар пройшов всі фільтри
        });

        // Сортування відфільтрованих товарів
        const sortBy = document.getElementById('sort-by').value;
        switch (sortBy) {
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                // Якщо у вас є timestamp або схожий атрибут, краще сортувати за ним.
                // Наразі сортуємо за ID, припускаючи, що більший ID = новіший.
                filtered.sort((a, b) => b.id - a.id);
                break;
            case 'popular':
            default:
                // За замовчуванням або "Популярні" можна сортувати за ID або додати окремий атрибут популярності
                filtered.sort((a, b) => a.id - b.id);
                break;
        }

        displayedProducts = filtered;
        renderProducts(displayedProducts); // Рендеримо відфільтровані та відсортовані товари
    }

    // Застосовуємо фільтри при завантаженні сторінки
    applyFiltersAndSort();

    // Обробники подій для фільтрів та сортування
    // Фільтрація за категоріями (радіокнопки)
    document.querySelectorAll('input[name="category-filter"]').forEach(radio => {
        radio.addEventListener('change', applyFiltersAndSort);
    });

    // Кнопка скидання фільтрів
    const resetButton = document.querySelector('.reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.getElementById('cat-all').checked = true; // Скидаємо категорію на "Всі товари"
            document.getElementById('price-from').value = '';
            document.getElementById('price-to').value = '';
            document.querySelectorAll('.color-filter-list input[type="checkbox"], .material-filter-list input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false; // Скидаємо чекбокси
            });
            document.getElementById('manufacturer-filter').selectedIndex = 0; // Скидаємо вибір виробника
            document.getElementById('sort-by').selectedIndex = 0; // Скидаємо сортування
            applyFiltersAndSort(); // Застосовуємо скинуті фільтри
        });
    }

    // Кнопка застосування цінового фільтра
    const applyPriceFilterButton = document.querySelector('.apply-price-filter');
    if (applyPriceFilterButton) {
        applyPriceFilterButton.addEventListener('click', applyFiltersAndSort);
    }

    // Обробники для чекбоксів кольору та матеріалу
    document.querySelectorAll('.color-filter-list input[type="checkbox"], .material-filter-list input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFiltersAndSort);
    });

    // Обробники для вибору виробника та сортування
    document.getElementById('manufacturer-filter').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sort-by').addEventListener('change', applyFiltersAndSort);
});
