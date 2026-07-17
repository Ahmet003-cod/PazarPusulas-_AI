/**
 * HausPort AI — Micro-Animations Module
 * Handles all UI animations, scroll behavior, and motion preferences.
 */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate a new message element sliding up and fading in.
 * @param {HTMLElement} element
 */
export function animateMessageEntry(element) {
  if (prefersReducedMotion) {
    element.style.opacity = '1';
    return;
  }
  element.style.opacity = '0';
  element.style.transform = 'translateY(16px)';
  requestAnimationFrame(() => {
    element.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  });
}

/**
 * Smooth-scroll the messages container to the bottom.
 * @param {HTMLElement} container
 * @param {boolean} instant — if true, jump immediately
 */
export function scrollToBottom(container, instant = false) {
  if (!container) return;
  if (instant || prefersReducedMotion) {
    container.scrollTop = container.scrollHeight;
    return;
  }
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
}

/**
 * Animate a button press (scale down then up).
 * @param {HTMLElement} btn
 */
export function animateButtonPress(btn) {
  if (prefersReducedMotion) return;
  btn.style.transition = 'transform 120ms ease';
  btn.style.transform = 'scale(0.92)';
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
  }, 120);
}

/**
 * Add hover-triggered scale effect on a card element.
 * @param {HTMLElement} card
 */
export function animateCardHover(card) {
  if (prefersReducedMotion) return;
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 250ms ease';
    card.style.transform = 'translateY(-3px)';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
  });
}

/**
 * Set up an IntersectionObserver for scroll-triggered animations.
 * Elements with [data-animate] will get an .animate-in class when visible.
 */
export function initScrollAnimations() {
  if (prefersReducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('[data-animate]').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Animate the gradient text in the welcome title.
 * Already handled via CSS @keyframes gradientShift, this applies the class.
 */
export function animateGradientTitle() {
  const el = document.querySelector('.gradient-text');
  if (el) {
    el.style.backgroundSize = '200% 200%';
  }
}

/**
 * Create a ripple effect on a clickable element.
 * @param {HTMLElement} element
 * @param {MouseEvent} event
 */
export function createRipple(element, event) {
  if (prefersReducedMotion) return;

  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    transform: scale(0);
    pointer-events: none;
    animation: rippleAnim 0.6s ease-out forwards;
  `;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

/**
 * Inject the ripple keyframe into the document if not already present.
 */
function injectRippleKeyframes() {
  if (document.getElementById('ripple-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'ripple-keyframes';
  style.textContent = `
    @keyframes rippleAnim {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Stagger-animate a list of elements (used for product cards, chat history).
 * @param {NodeList|Array<HTMLElement>} elements
 * @param {number} delayMs — delay between each element
 */
export function staggerAnimation(elements, delayMs = 60) {
  if (prefersReducedMotion) {
    elements.forEach((el) => { el.style.opacity = '1'; });
    return;
  }
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.35s ease-out, transform 0.35s ease-out';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * delayMs);
  });
}

// Initialize on import
injectRippleKeyframes();
