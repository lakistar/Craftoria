// j/product.js

document.addEventListener('DOMContentLoaded', () => {
    // allProducts тепер глобально доступний з j/products-data.js

    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    let currentProduct = allProducts.find(p => p.id === productId); // Поточний вибраний товар

    const productNameElement = document.getElementById('product-name');
    const productImageDiv = document.getElementById('product-image');
    const productPriceElement = document.getElementById('product-price');
    const productDescriptionElement = document.getElementById('product-description');
    const quantityInput = document.getElementById('quantity-input');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const colorSwatchesContainer = document.getElementById('color-swatches-container');
    const currentColorNameSpan = document.getElementById('current-color-name');

    // Функція для оновлення відображення товару
    function updateProductDisplay(product) {
        if (!product) {
            document.querySelector('main').innerHTML = `
                <div class="container" style="text-align: center; padding: 50px;">
                    <h1>На жаль, товар не знайдено.</h1>
                    <p>Можливо, він був видалений або переміщений.</p>
                    <a href="category-page.html" class="button primary-button">Повернутися до каталогу</a>
                </div>
            `;
            return;
        }

        currentProduct = product; // Оновлюємо поточний товар

        productNameElement.textContent = product.name;
        if (productImageDiv) {
            productImageDiv.style.backgroundImage = `url(${product.image})`;
            productImageDiv.style.backgroundSize = 'contain';
            productImageDiv.style.backgroundPosition = 'center';
            productImageDiv.style.backgroundRepeat = 'no-repeat';
        }
        productPriceElement.textContent = `${product.price.toFixed(2)} ₴`;
        productDescriptionElement.textContent = product.description || 'Детальний опис товару відсутній.';

        // Оновлюємо data-product-id для кнопки кошика
        if (addToCartBtn) {
            addToCartBtn.dataset.productId = product.id;
        }

        // Оновлюємо назву поточного кольору
        currentColorNameSpan.textContent = product.color ? product.color.charAt(0).toUpperCase() + product.color.slice(1) : 'Не вказано';
    }

    // Функція для генерації та відображення варіантів кольору
    function renderColorSwatches(baseProductName, currentProductId) {
        colorSwatchesContainer.innerHTML = ''; // Очищаємо попередні свотчі

        // Видаляємо частину "(колір)" з назви, щоб отримати базову назву
        const cleanBaseName = baseProductName.replace(/\s\(.+\)/, '');

        // Знаходимо всі варіанти цього товару
        const variants = allProducts.filter(p => p.name.includes(cleanBaseName));

        if (variants.length > 1) { // Показуємо селектор кольору, тільки якщо є більше одного варіанту
            variants.forEach(variant => {
                const swatch = document.createElement('div');
                swatch.classList.add('color-swatch');
                swatch.style.backgroundColor = getCssColor(variant.color); // Отримуємо CSS-колір
                swatch.dataset.productId = variant.id;
                swatch.title = variant.color.charAt(0).toUpperCase() + variant.color.slice(1); // Підказка з назвою кольору

                if (variant.id === currentProductId) {
                    swatch.classList.add('active');
                }

                swatch.addEventListener('click', () => {
                    // Видаляємо клас 'active' з усіх свотчів
                    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                    // Додаємо 'active' до вибраного свотча
                    swatch.classList.add('active');

                    const selectedProduct = allProducts.find(p => p.id === parseInt(swatch.dataset.productId));
                    if (selectedProduct) {
                        updateProductDisplay(selectedProduct);
                        // Оновлюємо URL без перезавантаження сторінки
                        history.pushState(null, '', `product.html?id=${selectedProduct.id}`);
                    }
                });
                colorSwatchesContainer.appendChild(swatch);
            });
        } else {
            // Якщо варіантів немає або лише один, приховуємо селектор
            const colorSelector = document.querySelector('.product-color-selector');
            if (colorSelector) {
                colorSelector.style.display = 'none';
            }
        }
    }

    // Допоміжна функція для отримання CSS-коду кольору за назвою
    function getCssColor(colorName) {
        switch (colorName.toLowerCase()) {
            case 'red': return '#e74c3c';
            case 'blue': return '#3498db';
            case 'green': return '#2ecc71';
            case 'white': return '#ffffff';
            case 'black': return '#333333';
            case 'yellow': return '#f1c40f';
            case 'gray': return '#95a5a6';
            case 'beige': return '#f5f5dc';
            case 'brown': return '#a0522d';
            case 'pink': return '#ffc0cb';
            case 'cream': return '#fffdd0';
            case 'transparent': return 'repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 0 / 10px 10px'; // Шахматка
            case 'multi': return 'linear-gradient(45deg, #e74c3c, #3498db, #2ecc71, #f1c40f)'; // Градієнт
            default: return '#cccccc'; // Дефолтний сірий
        }
    }

    // Ініціалізація сторінки
    updateProductDisplay(currentProduct);
    if (currentProduct) {
        renderColorSwatches(currentProduct.name, currentProduct.id);
    }

    // Обробник для кнопки "Додати до кошика"
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value) || 1;
            if (isNaN(quantity) || quantity <= 0) {
                quantityInput.value = 1; // Забезпечуємо мінімум 1
            }

            const cartItems = getStoredItems('cartItems');
            // Додаємо до кошика поточний вибраний товар (currentProduct.id)
            cartItems[currentProduct.id] = (cartItems[currentProduct.id] || 0) + quantity;
            saveItemsToStorage('cartItems', cartItems);
            alert(`${currentProduct.name} (${quantity} шт.) додано до кошика!`);
            updateHeaderCounts();
        });
    }
});
