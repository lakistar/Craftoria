import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Імпортуємо всі товари з products-data.js
// Переконайтеся, що у файлі j/products-data.js в кінці є рядок:
// export { allProducts };
import { allProducts } from './j/products-data.js'; // Змінено: додано розширення .js до шляху імпорту

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null; // Corrected: ensure it's accessed correctly

// --- Firebase Context for global access ---
const FirebaseContext = createContext(null);

function FirebaseProvider({ children }) {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        // Initialize Firebase
        if (Object.keys(firebaseConfig).length > 0) {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestore);
            setAuth(firebaseAuth);

            // Listen for auth state changes
            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Sign in anonymously if no custom token or user logs out
                    if (!initialAuthToken) { // Only sign in anonymously if no initialAuthToken
                        try {
                            const anonUser = await signInAnonymously(firebaseAuth);
                            setUserId(anonUser.user.uid);
                        } catch (error) {
                            console.error("Error signing in anonymously:", error);
                        }
                    }
                }
                setIsAuthReady(true); // Set auth ready after initial check
            });

            // Sign in with custom token if available
            if (initialAuthToken) {
                signInWithCustomToken(firebaseAuth, initialAuthToken)
                    .then((userCredential) => {
                        console.log("Signed in with custom token:", userCredential.user.uid);
                    })
                    .catch((error) => {
                        console.error("Error signing in with custom token:", error);
                        // Fallback to anonymous if custom token fails
                        signInAnonymously(firebaseAuth)
                            .then(anonUser => setUserId(anonUser.user.uid))
                            .catch(err => console.error("Error signing in anonymously after token failure:", err));
                    });
            } else {
                // If no initialAuthToken, sign in anonymously immediately
                signInAnonymously(firebaseAuth)
                    .then(anonUser => setUserId(anonUser.user.uid))
                    .catch(err => console.error("Error signing in anonymously:", err));
            }

            return () => unsubscribe(); // Cleanup auth listener
        } else {
            console.warn("Firebase config is missing. Firestore functionality will be limited.");
            setIsAuthReady(true); // Still set to true to allow app to render
        }
    }, []); // Empty dependency array means this runs once on mount

    return (
        <FirebaseContext.Provider value={{ db, auth, userId, isAuthReady }}>
            {children}
        </FirebaseContext.Provider>
    );
}

// Custom hook to use Firebase context
function useFirebase() {
    return useContext(FirebaseContext);
}

// --- Local Storage Utility Functions ---
const getStoredItems = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : {};
    } catch (error) {
        console.error(`Error reading from localStorage key "${key}":`, error);
        return {};
    }
};

const saveItemsToStorage = (key, items) => {
    try {
        localStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
    }
};

// --- Header Component (reused from your existing structure) ---
const Header = ({ cartCount, navigate }) => { // Added navigate prop
    return (
        <header className="bg-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold text-gray-800 flex items-center">
                    <img src="https://via.placeholder.com/60x40?text=Logo" alt="Лого HandyCraft Shop" className="w-15 h-10 mr-2 rounded" />
                    HandyCraft Shop
                </div>
                <nav className="hidden md:flex space-x-6">
                    <a href="#" onClick={() => navigate('home')} className="text-gray-600 hover:text-green-700 font-semibold">Головна</a>
                    <a href="#" onClick={() => navigate('catalog')} className="text-gray-600 hover:text-green-700 font-semibold">Каталог</a>
                    <a href="#" onClick={() => navigate('delivery')} className="text-gray-600 hover:text-green-700 font-semibold">Доставка</a>
                    <a href="#" onClick={() => navigate('contacts')} className="text-gray-600 hover:text-green-700 font-semibold">Контакти</a>
                    <a href="#" onClick={() => navigate('admin')} className="text-gray-600 hover:text-green-700 font-semibold">Адмін</a> {/* New Admin Link */}
                </nav>
                <div className="relative">
                    <a href="#" onClick={() => navigate('cart')} className="relative">
                        <img src="https://cdn-icons-png.flaticon.com/512/263/263142.png" alt="Кошик" className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </a>
                </div>
            </div>
        </header>
    );
};

// --- Product Card Component (reused) ---
const ProductCard = ({ product, onAddToCart }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between h-full">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
                <p className="text-2xl font-bold text-orange-600 mb-4">{product.price.toFixed(2)} ₴</p>
                <div className="flex justify-center mt-auto">
                    <button
                        onClick={() => onAddToCart(product.id)}
                        className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition duration-300"
                    >
                        Додати до кошика
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Catalog Page ---
const CatalogPage = ({ onAddToCart }) => {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold text-center text-green-700 mb-8">Наш Каталог</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                ))}
            </div>
        </div>
    );
};

// --- Cart Page ---
const CartPage = ({ onUpdateCart, onClearCart, navigate }) => {
    const [cartItems, setCartItems] = useState(getStoredItems('cartItems'));
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        calculateTotalPrice();
    }, [cartItems]);

    const calculateTotalPrice = () => {
        let total = 0;
        for (const productId in cartItems) {
            const quantity = cartItems[productId];
            const product = allProducts.find(p => p.id === parseInt(productId));
            if (product) {
                total += product.price * quantity;
            }
        }
        setTotalPrice(total);
    };

    const handleQuantityChange = (productId, delta) => {
        const newCartItems = { ...cartItems };
        newCartItems[productId] = (newCartItems[productId] || 0) + delta;
        if (newCartItems[productId] <= 0) {
            delete newCartItems[productId];
        }
        saveItemsToStorage('cartItems', newCartItems);
        setCartItems(newCartItems);
        onUpdateCart(); // Notify App to update header count
    };

    const handleRemoveItem = (productId) => {
        const newCartItems = { ...cartItems };
        delete newCartItems[productId];
        saveItemsToStorage('cartItems', newCartItems);
        setCartItems(newCartItems);
        onUpdateCart(); // Notify App to update header count
    };

    const handleClearCart = () => {
        saveItemsToStorage('cartItems', {});
        setCartItems({});
        onClearCart(); // Notify App to clear header count
    };

    const hasItems = Object.keys(cartItems).some(id => cartItems[id] > 0);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold text-center text-green-700 mb-8">Ваш Кошик</h1>

            {!hasItems ? (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-gray-600 mb-6">Ваш кошик порожній.</p>
                    <button onClick={() => navigate('catalog')} className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition duration-300">
                        Перейти до каталогу
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                        {Object.keys(cartItems).map(productId => {
                            const product = allProducts.find(p => p.id === parseInt(productId));
                            if (!product || cartItems[productId] <= 0) return null;

                            return (
                                <div key={productId} className="flex items-center border-b border-gray-200 py-4 last:border-b-0">
                                    <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg mr-4" />
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                                        <p className="text-gray-600">{product.price.toFixed(2)} ₴</p>
                                    </div>
                                    <div className="flex items-center space-x-2 mr-4">
                                        <button onClick={() => handleQuantityChange(productId, -1)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300">-</button>
                                        <span className="text-lg font-semibold">{cartItems[productId]}</span>
                                        <button onClick={() => handleQuantityChange(productId, 1)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300">+</button>
                                    </div>
                                    <p className="text-xl font-bold text-orange-600 mr-4">{(product.price * cartItems[productId]).toFixed(2)} ₴</p>
                                    <button onClick={() => handleRemoveItem(productId)} className="bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200">Видалити</button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 text-right">
                        <p className="text-2xl font-bold text-gray-800 mb-4">Загальна сума: <span className="text-orange-600">{totalPrice.toFixed(2)} ₴</span></p>
                        <button onClick={() => navigate('checkout')} className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition duration-300 mr-4">
                            Оформити замовлення
                        </button>
                        <button onClick={handleClearCart} className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                            Очистити кошик
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// --- Checkout Page ---
const CheckoutPage = ({ navigate, onClearCart }) => {
    const { db, userId, isAuthReady } = useFirebase();
    const [cartItems, setCartItems] = useState(getStoredItems('cartItems'));
    const [totalPrice, setTotalPrice] = useState(0);
    const [orderId, setOrderId] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);

    useEffect(() => {
        calculateTotalPrice();
    }, [cartItems]);

    const calculateTotalPrice = () => {
        let total = 0;
        for (const productId in cartItems) {
            const quantity = cartItems[productId];
            const product = allProducts.find(p => p.id === parseInt(productId));
            if (product) {
                total += product.price * quantity;
            }
        }
        setTotalPrice(total);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isAuthReady || !db || !userId) {
            alert("Firebase не ініціалізовано або користувач не авторизований. Спробуйте ще раз.");
            return;
        }

        const form = event.target;
        const formData = new FormData(form);
        const customerData = {};
        for (let [key, value] of formData.entries()) {
            customerData[key] = value;
        }

        const orderDetails = Object.keys(cartItems)
            .filter(productId => cartItems[productId] > 0)
            .map(productId => {
                const product = allProducts.find(p => p.id === parseInt(productId));
                return product ? {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: cartItems[productId],
                    image: product.image,
                    total: (product.price * cartItems[productId]).toFixed(2)
                } : null;
            }).filter(item => item !== null);

        if (orderDetails.length === 0) {
            alert("Ваш кошик порожній. Будь ласка, додайте товари перед оформленням замовлення.");
            navigate('catalog');
            return;
        }

        const order = {
            customerInfo: customerData,
            items: orderDetails,
            totalPrice: totalPrice.toFixed(2),
            status: 'Pending',
            createdAt: serverTimestamp(),
            userId: userId // Store the user ID who placed the order
        };

        try {
            const ordersCollectionRef = collection(db, `artifacts/${appId}/public/data/orders`);
            const docRef = await addDoc(ordersCollectionRef, order);
            setOrderId(docRef.id);
            setFormSubmitted(true);
            saveItemsToStorage('cartItems', {}); // Clear cart after successful order
            onClearCart(); // Update header cart count
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Виникла помилка при оформленні замовлення. Спробуйте ще раз.");
        }
    };

    if (formSubmitted) {
        return (
            <div className="container mx-auto p-6 text-center">
                <div className="bg-white rounded-lg shadow-lg p-10 mt-10">
                    <h1 className="text-4xl font-bold text-green-700 mb-6">Дякуємо за Ваше замовлення!</h1>
                    <p className="text-xl text-gray-700 mb-4">Ваше замовлення успішно оформлено.</p>
                    <p className="text-xl text-gray-700 mb-6">Номер Вашого замовлення: <strong className="text-orange-600">{orderId}</strong></p>
                    <div className="flex justify-center space-x-4">
                        <button onClick={() => navigate('home')} className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition duration-300">
                            Повернутися на головну
                        </button>
                        <button onClick={() => navigate('catalog')} className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                            Продовжити покупки
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hasItems = Object.keys(cartItems).some(id => cartItems[id] > 0);

    if (!hasItems) {
        return (
            <div className="container mx-auto p-6 text-center">
                <div className="bg-white rounded-lg shadow-lg p-10 mt-10">
                    <h1 className="text-4xl font-bold text-green-700 mb-6">Ваш кошик порожній.</h1>
                    <p className="text-xl text-gray-600 mb-6">Будь ласка, додайте товари, щоб оформити замовлення.</p>
                    <button onClick={() => navigate('catalog')} className="bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-800 transition duration-300">
                        Перейти до каталогу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold text-center text-green-700 mb-8">Оформлення замовлення</h1>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow lg:w-2/3 bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Ваші дані</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="full-name" className="block text-gray-700 text-sm font-bold mb-2">ПІБ:</label>
                            <input type="text" id="full-name" name="full-name" required className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500" placeholder="Іванов Іван Іванович" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">Телефон:</label>
                            <input type="tel" id="phone" name="phone" required className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500" placeholder="+380 XX XXX XX XX" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                            <input type="email" id="email" name="email" required className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500" placeholder="example@gmail.com" />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">Адреса доставки:</label>
                            <textarea id="address" name="address" rows="3" required className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-green-500" placeholder="Місто, вулиця, будинок, квартира"></textarea>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-8">Спосіб оплати</h2>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input type="radio" id="payment-cash" name="payment-method" value="Готівкою при отриманні" defaultChecked className="mr-2 h-4 w-4 text-green-700 focus:ring-green-500 border-gray-300" />
                                <label htmlFor="payment-cash" className="text-gray-700">Готівкою при отриманні</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="payment-card" name="payment-method" value="Оплата карткою онлайн" className="mr-2 h-4 w-4 text-green-700 focus:ring-green-500 border-gray-300" />
                                <label htmlFor="payment-card" className="text-gray-700">Оплата карткою онлайн</label>
                            </div>
                            <div className="flex items-center">
                                <input type="radio" id="payment-bank-transfer" name="payment-method" value="Безготівковий розрахунок" className="mr-2 h-4 w-4 text-green-700 focus:ring-green-500 border-gray-300" />
                                <label htmlFor="payment-bank-transfer" className="text-gray-700">Безготівковий розрахунок</label>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-green-700 text-white px-8 py-4 rounded-lg hover:bg-green-800 transition duration-300 text-xl font-semibold mt-8">
                            Підтвердити замовлення
                        </button>
                    </form>
                </div>

                <div className="lg:w-1/3 bg-white rounded-lg shadow-lg p-8 h-fit">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Ваше замовлення</h2>
                    <div className="space-y-4 border-b border-gray-200 pb-6 mb-6">
                        {Object.keys(cartItems).map(productId => {
                            const quantity = cartItems[productId];
                            const product = allProducts.find(p => p.id === parseInt(productId));
                            if (!product || quantity <= 0) return null;
                            return (
                                <div key={productId} className="flex items-center justify-between">
                                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded mr-3" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{product.name}</p>
                                        <p className="text-gray-600 text-sm">{quantity} x {product.price.toFixed(2)} ₴</p>
                                    </div>
                                    <p className="font-bold text-orange-600">{(product.price * quantity).toFixed(2)} ₴</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-right text-2xl font-bold text-gray-800">
                        Загальна сума: <span className="text-orange-600">{totalPrice.toFixed(2)} ₴</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Admin Orders Page ---
const AdminOrdersPage = ({ userId }) => {
    const { db, isAuthReady } = useFirebase();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newOrderAlert, setNewOrderAlert] = useState(false); // State for new order alert
    const audioRef = useRef(null); // Ref for audio element

    // Create an Audio object for the notification sound
    useEffect(() => {
        audioRef.current = new Audio('https://www.soundjay.com/buttons/beep-07a.mp3'); // A simple beep sound
        audioRef.current.volume = 0.5; // Adjust volume as needed
    }, []);

    useEffect(() => {
        if (!isAuthReady || !db) {
            console.log("Firebase not ready for orders page.");
            return;
        }

        setLoading(true);
        setError(null);

        const ordersCollectionRef = collection(db, `artifacts/${appId}/public/data/orders`);
        const q = query(ordersCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const fetchedOrders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Check for new orders only if not loading initially and there are more orders
                // We also check if the number of orders has actually increased to avoid false positives on initial load
                if (!loading && fetchedOrders.length > orders.length) {
                    setNewOrderAlert(true);
                    if (audioRef.current) {
                        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
                    }
                    setTimeout(() => setNewOrderAlert(false), 5000); // Hide alert after 5 seconds
                }

                setOrders(fetchedOrders);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching orders:", err);
                setError("Не вдалося завантажити замовлення.");
                setLoading(false);
            }
        );

        return () => unsubscribe(); // Clean up listener on unmount
    }, [db, isAuthReady, userId, loading, orders.length]); // Depend on orders.length to detect new orders

    if (loading) {
        return <div className="container mx-auto p-6 text-center text-xl text-gray-600">Завантаження замовлень...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-6 text-center text-xl text-red-600">Помилка: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-4xl font-bold text-center text-green-700 mb-8">Адмін-панель: Замовлення</h1>
            <p className="text-center text-gray-600 mb-6">Ваш ID користувача: <span className="font-mono text-blue-700 break-all">{userId || 'N/A'}</span></p>

            {newOrderAlert && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded" role="alert">
                    <p className="font-bold">Увага!</p>
                    <p>Нове замовлення надійшло!</p>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                    <p className="text-xl text-gray-600">Наразі немає замовлень.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Замовлення #{order.id}</h3>
                            <p className="text-gray-600 mb-2">Дата: {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                            <p className="text-gray-600 mb-4">Статус: <span className="font-semibold text-green-600">{order.status}</span></p>

                            <div className="mb-4">
                                <h4 className="font-bold text-gray-700 mb-2">Дані клієнта:</h4>
                                <p><strong>ПІБ:</strong> {order.customerInfo?.['full-name']}</p>
                                <p><strong>Телефон:</strong> {order.customerInfo?.phone}</p>
                                <p><strong>Email:</strong> {order.customerInfo?.email}</p>
                                <p><strong>Адреса:</strong> {order.customerInfo?.address}</p>
                                <p><strong>Спосіб оплати:</strong> {order.customerInfo?.['payment-method']}</p>
                                <p><strong>ID користувача:</strong> <span className="font-mono text-blue-600 break-all">{order.userId || 'N/A'}</span></p>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-bold text-gray-700 mb-2">Товари:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {order.items && order.items.map((item, index) => (
                                        <li key={index} className="text-gray-700">
                                            {item.name} (x{item.quantity}) - {item.total} ₴
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <p className="text-xl font-bold text-right text-gray-800">Загальна сума: <span className="text-orange-600">{order.totalPrice} ₴</span></p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Main App Content Component ---
// This component will consume the Firebase context
function MainAppContent({ currentPage, setCurrentPage, cartCount, updateCartCount, handleAddToCart, handleClearCart }) {
    const { userId, isAuthReady } = useFirebase(); // Now correctly within the provider's scope

    let PageComponent;
    switch (currentPage) {
        case 'home':
            PageComponent = () => (
                <div className="container mx-auto p-6 text-center">
                    <div className="bg-blue-100 p-12 rounded-lg shadow-xl mt-10">
                        <h1 className="text-5xl font-extrabold text-blue-800 mb-6">Ласкаво просимо до HandyCraft Shop!</h1>
                        <p className="text-xl text-blue-700 mb-8">Ваш улюблений магазин товарів для рукоділля.</p>
                        <button onClick={() => setCurrentPage('catalog')} className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-blue-700 transition duration-300 shadow-lg">
                            Перейти до каталогу
                        </button>
                    </div>
                </div>
            );
            break;
        case 'catalog':
            PageComponent = () => <CatalogPage onAddToCart={handleAddToCart} />;
            break;
        case 'cart':
            PageComponent = () => <CartPage onUpdateCart={updateCartCount} onClearCart={handleClearCart} navigate={setCurrentPage} />;
            break;
        case 'checkout':
            PageComponent = () => <CheckoutPage navigate={setCurrentPage} onClearCart={handleClearCart} />;
            break;
        case 'admin':
            PageComponent = () => <AdminOrdersPage userId={userId} />;
            break;
        // Add cases for 'delivery' and 'contacts' if you want to implement those pages
        case 'delivery':
            PageComponent = () => (
                <div className="container mx-auto p-6 text-center">
                    <div className="bg-white p-10 rounded-lg shadow-md mt-10">
                        <h1 className="text-4xl font-bold text-green-700 mb-6">Доставка</h1>
                        <p className="text-lg text-gray-700">Інформація про умови доставки буде тут.</p>
                        <button onClick={() => setCurrentPage('home')} className="mt-8 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                            Повернутися на головну
                        </button>
                    </div>
                </div>
            );
            break;
        case 'contacts':
            PageComponent = () => (
                <div className="container mx-auto p-6 text-center">
                    <div className="bg-white p-10 rounded-lg shadow-md mt-10">
                        <h1 className="text-4xl font-bold text-green-700 mb-6">Контакти</h1>
                        <p className="text-lg text-gray-700">Зв'яжіться з нами за телефоном: +380 XX XXX XX XX або email: info@handycraft.shop</p>
                        <button onClick={() => setCurrentPage('home')} className="mt-8 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                            Повернутися на головну
                        </button>
                    </div>
                </div>
            );
            break;
        default:
            PageComponent = () => <div>Сторінка не знайдена</div>;
    }

    return (
        <>
            <Header cartCount={cartCount} navigate={setCurrentPage} />
            <main className="py-8">
                {isAuthReady ? PageComponent() : <div className="text-center text-xl text-gray-600 mt-10">Завантаження...</div>}
            </main>
            <footer className="bg-gray-800 text-white text-center p-6 mt-8">
                <p>&copy; 2025 HandyCraft Shop. Усі права захищені.</p>
            </footer>
        </>
    );
}


// --- Main App Component ---
function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [cartCount, setCartCount] = useState(0);

    // Update cart count on initial load and whenever cart changes
    useEffect(() => {
        const items = getStoredItems('cartItems');
        let count = 0;
        for (const id in items) {
            count += items[id];
        }
        setCartCount(count);
    }, []); // Only run once on mount

    const updateCartCount = () => {
        const items = getStoredItems('cartItems');
        let count = 0;
        for (const id in items) {
            count += items[id];
        }
        setCartCount(count);
    };

    const handleAddToCart = (productId) => {
        const cartItems = getStoredItems('cartItems');
        cartItems[productId] = (cartItems[productId] || 0) + 1;
        saveItemsToStorage('cartItems', cartItems);
        updateCartCount();
        alert(`Товар додано до кошика!`); // Using alert for simplicity, consider a custom modal
    };

    const handleClearCart = () => {
        setCartCount(0);
    };

    return (
        <FirebaseProvider>
            <div className="min-h-screen bg-gray-100 font-sans">
                <MainAppContent
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    cartCount={cartCount}
                    updateCartCount={updateCartCount}
                    handleAddToCart={handleAddToCart}
                    handleClearCart={handleClearCart}
                />
            </div>
        </FirebaseProvider>
    );
}

export default App;
