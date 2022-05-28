import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
    
      //Check if the product has already been added
      const productIndex = cart.findIndex(product => product.id === productId)
      if(productIndex === -1){
        const response = await api.get(`products/${productId}`)
        const product = response.data
  
        const data = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ]

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(data))
        setCart(data)

      } else {
        const product = cart.find(product => product.id === productId)
        await updateProductAmount({
          productId,
          amount: product?.amount! + 1
        })
        
      }
    } catch (error) {
      toast.error('Erro na adição do produto');
      console.warn(error)
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExist = cart.find(product => product.id === productId)
      if(productExist === undefined) {
        throw Error('Produto não existe')
      }

      const newCart = cart.filter(product => product.id !== productId)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    } catch (error) {
      toast.error('Erro na remoção do produto');
      console.warn(error)
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) return
      const response = await api.get(`stock/${productId}`)
      const productStock: Stock = response.data


      if(amount <= productStock.amount) {
        const newCart = cart.map(product => product.id === productId ? {
          ...product,
          amount
        } : product)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        setCart(newCart)

      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
