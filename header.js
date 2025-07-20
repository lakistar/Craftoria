// j/header.js

function getStoredItems(key) {
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : {};
}

function saveItemsToStorage(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
}

function updateHeaderCounts() {
    const cartCountSpan = document.getElementById('cart-count');
    // const favoritesCountSpan = document.getElementById('favorites-count'); // Видалено

    const cartItems = getStoredItems('cartItems');
    // const favorites = getStoredItems('favorites'); // Видалено

    const totalCartItems = Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
    // const totalFavorites = Object.keys(favorites).length; // Видалено

    if (cartCountSpan) {
        cartCountSpan.textContent = totalCartItems;
        if (totalCartItems === 0) {
            cartCountSpan.classList.add('hidden');
        } else {
            cartCountSpan.classList.remove('hidden');
        }
    }

    // if (favoritesCountSpan) { // Видалено
    //     favoritesCountSpan.textContent = totalFavorites;
    //     if (totalFavorites === 0) {
    //         favoritesCountSpan.classList.add('hidden');
    //     } else {
    //         favoritesCountSpan.classList.remove('hidden');
    //     }
    // }
}

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderCounts();
});
