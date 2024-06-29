import { Router } from 'express';

import * as productCtrl from '../controllers/products.controller.js';


const router = Router()

router.get('/', productCtrl.getProducts)
router.get('/:id', productCtrl.getProduct)

export default router;