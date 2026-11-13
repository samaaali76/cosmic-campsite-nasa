export function setupNavigation() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
  });

  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const targets = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const setCurrent = (target) => {
    links.forEach((link) => {
      const current = link.hash === `#${target.id}`;
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setCurrent(visible.target);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0, .15, .35, .6] });
    targets.forEach((target) => observer.observe(target));
  }
}
