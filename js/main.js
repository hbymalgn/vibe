// Main JavaScript entry point for the web-based design editor

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Web-based design editor initialized.');

    // Add event listeners for login and logout buttons
    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');

    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});

// Function to handle user login
function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Call the authentication function from auth.js
    authenticateUser(email, password);
}

// Function to handle user logout
function handleLogout() {
    // Call the logout function from auth.js
    logoutUser();
}

// Function to display user projects on the dashboard
function displayUserProjects(projects) {
    const projectsContainer = document.getElementById('projectsContainer');
    projectsContainer.innerHTML = '';

    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.className = 'project';
        projectElement.innerText = project.title; // Assuming project has a title property
        projectsContainer.appendChild(projectElement);
    });
}