const express = require('express');
const { addComment, deleteComment, getProjectDiscussions } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', addComment);
router.delete('/:id', deleteComment);
router.get('/project/:projectId', getProjectDiscussions);

module.exports = router;
