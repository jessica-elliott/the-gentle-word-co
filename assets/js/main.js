// The Gentle Word Co. — main.js
// Minimal, dependency-free JavaScript

document.addEventListener('DOMContentLoaded', function () {
  // ── Mobile navigation toggle ──
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when a link is clicked
    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Lazy load images ──
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported — images already have loading="lazy"
  } else {
    // Fallback: IntersectionObserver
    var lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
            }
            observer.unobserve(img);
          }
        });
      });
      lazyImages.forEach(function (img) {
        observer.observe(img);
      });
    }
  }

});
