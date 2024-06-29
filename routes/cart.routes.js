import { Router } from 'express';

import * as cartCtrl from '../controllers/cart.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import stripeMiddleware from '../middleware/stripe.middleware.js';


const router = Router()

router.get('/:id', cartCtrl.getProductsCart)
router.post('/add-product/:id', cartCtrl.addProductCart)
router.put('/update-cart/:id', authenticate, cartCtrl.updateProductCart)
router.delete('/:userId/:productId',authenticate, cartCtrl.deleteProductCart)
router.post('/checkout/:id', cartCtrl.checkout)

export default router;

