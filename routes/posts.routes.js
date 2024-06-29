import { Router } from 'express';

import * as postsCtrl from '../controllers/posts.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authenticate, postsCtrl.createPost);
router.get('/', postsCtrl.getAllPosts);
router.get('/:id', postsCtrl.getPost);
router.get('/location/:location', postsCtrl.getPostsByLocation);
router.get('/species/:specie', postsCtrl.getPostsBySpecie);
router.get('/users/:id', postsCtrl.getAuthorPosts);
router.patch('/:id', authenticate, postsCtrl.updatePost);
router.delete('/:id', authenticate, postsCtrl.deletePost);

export default router;
