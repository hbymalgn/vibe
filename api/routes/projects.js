const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');

// Route to save a project
router.post('/save', authMiddleware, projectController.saveProject);

// Route to load a user's projects
router.get('/load', authMiddleware, projectController.loadProjects);

// Route to delete a specific project
router.delete('/delete/:id', authMiddleware, projectController.deleteProject);

module.exports = router;