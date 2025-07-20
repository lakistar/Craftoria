// j/category-page.js

// Переконайтеся, що allProducts, getStoredItems, saveItemsToStorage, addToCart
// визначені в products-data.js та main.js відповідно і підключені ПЕРЕД цим скриптом в HTML.

document.addEventListener('DOMContentLoaded', () => {
    const categoryTitleElement = document.getElementById('category-title');
    const productGrid = document.getElementById('category-product-grid');

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex = null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let initialCategoryParam = getUrlParameter('category');
    let currentCategoryFilter = initialCategoryParam || 'all';

    const categoryMap = {
        'all': 'Всі товари',
        'beads': 'Бісер та Бісероплетіння',
        'threads': 'Нитки та Пряжа',
        'fabrics': 'Тканини та Основи',
        'decor': 'Фурнітура та Декор',
        'kits': 'Набори для Рукоділля',
        'tools': 'Інструменти та Допоміжні Матеріали'
    };

    categoryTitleElement.textContent = `Каталог: ${categoryMap[currentCategoryFilter] || 'Всі товари'}`;

    const initialCategoryRadio = document.getElementById(`cat-${currentCategoryFilter}`);
    if (initialCategoryRadio) {
        initialCategoryRadio.checked = true;
    }

    let displayedProducts = [];

    // --- ПОЧАТОК ЗМІН ---
    // Переміщуємо обробник делегування подій СЮДИ, за межі renderProducts
    productGrid.addEventListener('click', (event) => {
        const targetButton = event.target.closest('.add-to-cart-btn');
        if (targetButton) {
            event.preventDefault();
            const productId = parseInt(targetButton.dataset.productId);

            // Використовуємо глобальну функцію addToCart з j/main.js
            addToCart(productId);

            // Оновлюємо текст кнопки на "В кошику"
            targetButton.textContent = 'В кошику';
            // Також можна вимкнути кнопку після додавання, щоб уникнути подвійних кліків
            // targetButton.disabled = true;
        }
    });
    // --- КІНЕЦЬ ЗМІН ---


    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; width: 100%;">Товарів за вибраними критеріями не знайдено.</p>';
            return;
        }

        const cartItems = getStoredItems('cartItems');

        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');

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

        // Цей блок ПОВИНЕН БУТИ ВИДАЛЕНИЙ або ЗАКОМЕНТОВАНИЙ
        // productGrid.querySelectorAll('.add-to-cart-btn').forEach(button => {
        //     button.addEventListener('click', (event) => {
        //         // ... ця логіка тепер обробляється делегованим обробником вище
        //     });
        // });
    }

    function applyFiltersAndSort() {
        const selectedCategoryRadio = document.querySelector('input[name="category-filter"]:checked');
        currentCategoryFilter = selectedCategoryRadio ? selectedCategoryRadio.value : 'all';

        categoryTitleElement.textContent = `Каталог: ${categoryMap[currentCategoryFilter] || 'Всі товари'}`;

        let filtered = allProducts.filter(product => {
            if (currentCategoryFilter !== 'all' && product.category !== currentCategoryFilter) {
                return false;
            }

            const priceFrom = parseFloat(document.getElementById('price-from').value) || 0;
            const priceTo = parseFloat(document.getElementById('price-to').value) || Infinity;
            if (product.price < priceFrom || product.price > priceTo) {
                return false;
            }

            const selectedColors = Array.from(document.querySelectorAll('.color-filter-list input[type="checkbox"]:checked'))
                                             .map(cb => cb.value);
            if (selectedColors.length > 0 && !selectedColors.includes(product.color)) {
                return false;
            }

            const selectedMaterials = Array.from(document.querySelectorAll('.material-filter-list input[type="checkbox"]:checked'))
                                                     .map(cb => cb.value);
            if (selectedMaterials.length > 0 && !selectedMaterials.includes(product.material)) {
                return false;
            }

            const selectedManufacturer = document.getElementById('manufacturer-filter').value;
            if (selectedManufacturer && product.manufacturer !== selectedManufacturer) {
                return false;
            }

            return true;
        });

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
        renderProducts(displayedProducts);
    }

    applyFiltersAndSort();

    document.querySelectorAll('input[name="category-filter"]').forEach(radio => {
        radio.addEventListener('change', applyFiltersAndSort);
    });

    const resetButton = document.querySelector('.reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.getElementById('cat-all').checked = true;
            document.getElementById('price-from').value = '';
            document.getElementById('price-to').value = '';
            document.querySelectorAll('.color-filter-list input[type="checkbox"], .material-filter-list input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            document.getElementById('manufacturer-filter').selectedIndex = 0;
            document.getElementById('sort-by').selectedIndex = 0;
            applyFiltersAndSort();
        });
    }

    const applyPriceFilterButton = document.querySelector('.apply-price-filter');
    if (applyPriceFilterButton) {
        applyPriceFilterButton.addEventListener('click', applyFiltersAndSort);
    }

    document.querySelectorAll('.color-filter-list input[type="checkbox"], .material-filter-list input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFiltersAndSort);
    });

    document.getElementById('manufacturer-filter').addEventListener('change', applyFiltersAndSort);
    document.getElementById('sort-by').addEventListener('change', applyFiltersAndSort);
});
