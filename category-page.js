// j/category-page.js

// Переконайтеся, що 'allProducts' (з j/products-data.js)
// та 'getStoredItems', 'saveItemsToStorage', 'addToCart', 'updateHeaderCounts' (з j/main.js)
// визначені та підключені ПЕРЕД цим скриптом в HTML.
// Правильний порядок підключення в HTML:
// <script src="j/products-data.js"></script>
// <script src="j/main.js"></script>
// <script src="j/category-page.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const categoryTitleElement = document.getElementById('category-title');
    const productGrid = document.getElementById('category-product-grid');

    // Функція для отримання параметра з URL
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);

        // ВИПРАВЛЕННЯ ПОМИЛКИ: "Cannot read properties of undefined (reading '1')"
        // Перевіряємо, чи 'results' існує і чи має хоча б одну групу захоплення (індекс 1)
        if (results && results[1]) {
            return decodeURIComponent(results[1].replace(/\+/g, ' '));
        } else {
            return ''; // Повертаємо порожній рядок, якщо параметр не знайдено
        }
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

    let displayedProducts = [];

    // --- ПОЧАТОК КЛЮЧОВИХ ЗМІН ДЛЯ ОБРОБНИКА ПОДІЙ ---
    // Обробник делегування подій для кнопок "Додати до кошика"
    // Цей обробник додається ОДИН РАЗ при завантаженні сторінки (в DOMContentLoaded)
    // і ловить кліки на всі кнопки '.add-to-cart-btn' всередині 'productGrid',
    // навіть ті, що додаються динамічно через renderProducts.
    productGrid.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.add-to-cart-btn'); // Знаходимо найближчу кнопку з класом
        if (targetButton) {
            event.preventDefault(); // Запобігаємо стандартній поведінці (наприклад, переходу за посиланням)
            const productId = parseInt(targetButton.dataset.productId);

            // ВИПРАВЛЕННЯ: Виклик функції addToCart (з маленької 'a')
            addToCart(productId); // Ця функція оновлює localStorage та викликає updateHeaderCounts()

            // Оновлюємо текст кнопки на "В кошику"
            targetButton.textContent = 'В кошику';
            // За бажанням, можна вимкнути кнопку після додавання
            // targetButton.disabled = true;
        }
    });
    // --- КІНЕЦЬ КЛЮЧОВИХ ЗМІН ---


    // Функція рендерингу товарів у сітці
    function renderProducts(productsToRender) {
        productGrid.innerHTML = ''; // Очищаємо сітку перед рендерингом

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; width: 100%;">Товарів за вибраними критеріями не знайдено.</p>';
            return;
        }

        // Отримуємо поточний стан кошика для відображення статусу "В кошику" на кнопках
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

        // ВАЖЛИВО: Цей блок (forEach, який додавав обробники до кожної кнопки)
        // ТЕПЕР ПОВИНЕН БУТИ ВИДАЛЕНИЙ АБО ЗАКОМЕНТОВАНИЙ.
        // Його присутність тут призводила до ПОВТОРНОГО додавання обробників подій,
        // що спричиняло подвійне додавання товарів при кожному кліку.
        /*
        productGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const productId = parseInt(event.target.dataset.productId);
                const productToAdd = allProducts.find(p => p.id === productId);

                if (productToAdd) {
                    const cartItems = getStoredItems('cartItems');
                    cartItems[productId] = (cartItems[productId] || 0) + 1;
                    saveItemsToStorage('cartItems', cartItems);
                    event.target.textContent = 'В кошику';
                    updateHeaderCounts();
                }
            });
        });
        */
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

            return true;
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
                filtered.sort((a, b) => b.id - a.id);
                break;
            case 'popular':
            default:
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
