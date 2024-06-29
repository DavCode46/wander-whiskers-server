import { Router } from 'express';

import * as ordersCtrl from '../controllers/orders.controller.js';


const router = Router()

router.get('/user/:id', ordersCtrl.getOrders)
router.get('/user/order/:id', ordersCtrl.getOrder)

export default router