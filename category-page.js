// j/category-page.js

document.addEventListener('DOMContentLoaded', () => {
    const categoryTitleElement = document.getElementById('category-title');
    const productGrid = document.getElementById('category-product-grid');

    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    let initialCategoryParam = getUrlParameter('category');
    let currentCategoryFilter = initialCategoryParam || 'all'; // Використовуємо 'all' за замовчуванням

    const categoryMap = {
        'all': 'Всі товари',
        'beads': 'Бісер та Бісероплетіння',
        'threads': 'Нитки та Пряжа',
        'fabrics': 'Тканини та Основи',
        'decor': 'Фурнітура та Декор',
        'kits': 'Набори для Рукоділля',
        'tools': 'Інструменти та Допоміжні Матеріали'
    };

    // Встановлюємо заголовок сторінки
    categoryTitleElement.textContent = `Каталог: ${categoryMap[currentCategoryFilter] || 'Всі товари'}`;

    // Встановлюємо початковий стан радіокнопок фільтрації категорій
    const initialCategoryRadio = document.getElementById(`cat-${currentCategoryFilter}`);
    if (initialCategoryRadio) {
        initialCategoryRadio.checked = true;
    }


    let displayedProducts = [];

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

            const isInCart = cartItems[product.id] > 0;

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
    }

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

    // Застосовуємо фільтри при завантаженні сторінки
    applyFiltersAndSort();

    // Обробники подій для нових фільтрів категорій
    document.querySelectorAll('input[name="category-filter"]').forEach(radio => {
        radio.addEventListener('change', applyFiltersAndSort);
    });

    const resetButton = document.querySelector('.reset-filters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Скидаємо фільтр категорії на "Всі товари"
            document.getElementById('cat-all').checked = true;

            document.getElementById('price-from').value = '';
            document.getElementById('price-to').value = '';
            document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
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
