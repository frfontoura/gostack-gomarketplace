import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem('@GoMarketplace:cart_products');
      if (items) {
        setProducts(JSON.parse(items));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart_products',
        JSON.stringify(products),
      );
    }
    updateStorage();
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const newProducts = [...products];
      const index = newProducts.findIndex(p => p.id === product.id);

      if (index > -1) {
        newProducts[index].quantity += 1;
        setProducts(newProducts);
      } else {
        setProducts([
          ...newProducts,
          {
            ...product,
            quantity: 1,
          },
        ]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const index = newProducts.findIndex(p => p.id === id);

      if (index > -1) {
        newProducts[index].quantity += 1;
        setProducts(newProducts);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];

      const index = newProducts.findIndex(p => p.id === id);

      if (index > -1) {
        if (newProducts[index].quantity <= 1) {
          setProducts(state => state.filter(product => product.id !== id));
        } else {
          newProducts[index].quantity -= 1;
          setProducts(newProducts);
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
