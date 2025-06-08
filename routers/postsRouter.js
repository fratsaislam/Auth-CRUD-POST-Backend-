const express = require("express");
const router = express.Router();

const postsController = require('../controllers/postsController.js');
const { identifier } = require('../middlewares/identification.js');

router.get('/all-posts', postsController.getPosts);
router.get('/single-post', postsController.singlePost);
router.post('/create-post', identifier, postsController.createPost);
router.put('/update-post', identifier, postsController.updatePost);
router.delete('/delete-post', identifier, postsController.deletePost);

module.exports = router;