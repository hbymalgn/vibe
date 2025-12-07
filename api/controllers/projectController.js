const Project = require('../models/projectModel'); // Assuming there's a project model

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const projectData = req.body;
        const newProject = new Project(projectData);
        await newProject.save();
        res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error: error.message });
    }
};

// Get all projects for a user
exports.getUserProjects = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user ID is stored in req.user
        const projects = await Project.find({ userId });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving projects', error: error.message });
    }
};

// Get a specific project by ID
exports.getProjectById = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving project', error: error.message });
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const updatedData = req.body;
        const project = await Project.findByIdAndUpdate(projectId, updatedData, { new: true });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: 'Project updated successfully', project });
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findByIdAndDelete(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};