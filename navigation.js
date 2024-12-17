document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Check if the current path matches the link's href
        // Also check for the home page which might be either '/' or 'index.html'
        if ((currentPath.endsWith(linkPath)) || 
            (linkPath.includes('github.io') && (currentPath === '/' || currentPath.endsWith('index.html')))) {
            link.classList.add('active');
        }
    });
});
