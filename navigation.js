document.addEventListener("DOMContentLoaded", function () {
  // Get current page path
  const currentPage = window.location.pathname.split("/").pop() || "";
  const homeUrl = "https://eimis1990.github.io/vismatech-absence.github.io/";

  // Get all navigation links
  const navLinks = document.querySelectorAll(".nav-links a");

  // Remove active class from all links
  navLinks.forEach((link) => {
    link.classList.remove("active");

    // Get the href
    const href = link.getAttribute("href");

    // Check if this is home page
    if (href === homeUrl) {
      // Add active class if we're on the home page (empty path or index.html)
      if (currentPage === "" || currentPage === "index.html") {
        link.classList.add("active");
      }
    } else {
      // For other pages, compare the last part of the path
      const hrefPath = href.split("/").pop();
      if (hrefPath === currentPage) {
        link.classList.add("active");
      }
    }
  });
});
