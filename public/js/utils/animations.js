/**
 * Animation Utilities
 * Provides utility functions for animations and transitions
 */

class AnimationUtils {
    constructor() {
        this.animationQueue = new Map();
        this.intersectionObserver = null;
        this.init();
    }

    /**
     * Initialize animation utilities
     */
    init() {
        this.setupIntersectionObserver();
        this.setupReducedMotionSupport();
    }

    /**
     * Setup intersection observer for scroll animations
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
    }

    /**
     * Setup reduced motion support
     */
    setupReducedMotionSupport() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduced-motion');
        }

        // Listen for changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                document.documentElement.classList.add('reduced-motion');
            } else {
                document.documentElement.classList.remove('reduced-motion');
            }
        });
    }

    /**
     * Animate element with specified animation
     */
    animate(element, animation, options = {}) {
        const {
            duration = 300,
            delay = 0,
            easing = 'ease-out',
            fillMode = 'forwards',
            iterationCount = 1,
            direction = 'normal'
        } = options;

        if (!element || !animation) return Promise.resolve();

        return new Promise((resolve) => {
            // Clear any existing animation
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow

            // Set animation properties
            element.style.animation = `${animation} ${duration}ms ${easing} ${delay}ms ${iterationCount} ${direction} ${fillMode}`;

            // Handle animation end
            const handleAnimationEnd = () => {
                element.removeEventListener('animationend', handleAnimationEnd);
                element.removeEventListener('animationcancel', handleAnimationEnd);
                resolve();
            };

            element.addEventListener('animationend', handleAnimationEnd);
            element.addEventListener('animationcancel', handleAnimationEnd);

            // Fallback timeout
            setTimeout(() => {
                handleAnimationEnd();
            }, duration + delay + 100);
        });
    }

    /**
     * Fade in element
     */
    fadeIn(element, options = {}) {
        return this.animate(element, 'fadeIn', options);
    }

    /**
     * Fade out element
     */
    fadeOut(element, options = {}) {
        return this.animate(element, 'fadeOut', options);
    }

    /**
     * Slide in from direction
     */
    slideIn(element, direction = 'up', options = {}) {
        const animations = {
            up: 'slideInUp',
            down: 'slideInDown',
            left: 'slideInLeft',
            right: 'slideInRight'
        };
        return this.animate(element, animations[direction] || 'slideInUp', options);
    }

    /**
     * Slide out to direction
     */
    slideOut(element, direction = 'up', options = {}) {
        const animations = {
            up: 'slideOutUp',
            down: 'slideOutDown',
            left: 'slideOutLeft',
            right: 'slideOutRight'
        };
        return this.animate(element, animations[direction] || 'slideOutUp', options);
    }

    /**
     * Scale in element
     */
    scaleIn(element, options = {}) {
        return this.animate(element, 'scaleIn', options);
    }

    /**
     * Scale out element
     */
    scaleOut(element, options = {}) {
        return this.animate(element, 'scaleOut', options);
    }

    /**
     * Bounce in element
     */
    bounceIn(element, options = {}) {
        return this.animate(element, 'bounceIn', options);
    }

    /**
     * Rotate in element
     */
    rotateIn(element, options = {}) {
        return this.animate(element, 'rotateIn', options);
    }

    /**
     * Stagger animation for multiple elements
     */
    stagger(elements, animation, options = {}) {
        const {
            staggerDelay = 100,
            ...animationOptions
        } = options;

        if (!Array.isArray(elements)) {
            elements = Array.from(elements);
        }

        const promises = elements.map((element, index) => {
            const delay = index * staggerDelay;
            return this.animate(element, animation, {
                ...animationOptions,
                delay: (animationOptions.delay || 0) + delay
            });
        });

        return Promise.all(promises);
    }

    /**
     * Chain animations
     */
    chain(element, animations, options = {}) {
        const {
            delay = 0
        } = options;

        return animations.reduce((promise, animation, index) => {
            return promise.then(() => {
                const animationDelay = index > 0 ? delay : 0;
                return this.animate(element, animation, { delay: animationDelay });
            });
        }, Promise.resolve());
    }

    /**
     * Observe element for scroll animations
     */
    observe(element, animation = 'fadeInUp', options = {}) {
        if (!this.intersectionObserver) return;

        const {
            threshold = 0.1,
            rootMargin = '0px 0px -50px 0px',
            once = true
        } =options;

        element.dataset.animation = animation;
        element.dataset.animationOnce = once.toString();

        this.intersectionObserver.observe(element);
    }

    /**
     * Unobserve element
     */
    unobserve(element) {
        if (!this.intersectionObserver) return;
        this.intersectionObserver.unobserve(element);
    }

    /**
     * Trigger animation on element
     */
    triggerAnimation(element) {
        const animation = element.dataset.animation;
        const once = element.dataset.animationOnce === 'true';

        if (!animation) return;

        this.animate(element, animation).then(() => {
            if (once) {
                this.unobserve(element);
            }
        });
    }

    /**
     * Animate to specific CSS properties
     */
    animateTo(element, properties, options = {}) {
        const {
            duration = 300,
            easing = 'ease-out',
            delay = 0
        } = options;

        return new Promise((resolve) => {
            // Store original values
            const originalValues = {};
            Object.keys(properties).forEach(prop => {
                originalValues[prop] = element.style[prop];
            });

            // Set transition
            element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;

            // Apply new properties
            Object.entries(properties).forEach(([prop, value]) => {
                element.style[prop] = value;
            });

            // Handle transition end
            const handleTransitionEnd = (e) => {
                if (e.target === element) {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element.removeEventListener('transitioncancel', handleTransitionEnd);
                    resolve();
                }
            };

            element.addEventListener('transitionend', handleTransitionEnd);
            element.addEventListener('transitioncancel', handleTransitionEnd);

            // Fallback timeout
            setTimeout(() => {
                handleTransitionEnd({ target: element });
            }, duration + delay + 100);
        });
    }

    /**
     * Create loading animation
     */
    createLoadingAnimation(element, type = 'spinner') {
        const loadingElement = document.createElement('div');
        loadingElement.className = `loading-${type}`;

        const types = {
            spinner: '<div class="loading-spinner"></div>',
            dots: '<div class="loading-dots"></div>',
            pulse: '<div class="loading-pulse"></div>',
            bars: '<div class="loading-bars"></div>'
        };

        loadingElement.innerHTML = types[type] || types.spinner;
        
        if (element) {
            element.appendChild(loadingElement);
        }

        return loadingElement;
    }

    /**
     * Remove loading animation
     */
    removeLoadingAnimation(element) {
        const loadingElements = element.querySelectorAll('[class*="loading-"]');
        loadingElements.forEach(el => el.remove());
    }

    /**
     * Create shimmer effect
     */
    createShimmer(element) {
        element.classList.add('shimmer');
        
        return () => {
            element.classList.remove('shimmer');
        };
    }

    /**
     * Create ripple effect
     */
    createRipple(element, event) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Parallax effect
     */
    createParallax(element, options = {}) {
        const {
            speed = 0.5,
            direction = 'vertical'
        } = options;

        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -speed;

            if (direction === 'vertical') {
                element.style.transform = `translateY(${rate}px)`;
            } else if (direction === 'horizontal') {
                element.style.transform = `translateX(${rate}px)`;
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }

    /**
     * Typewriter effect
     */
    typewriter(element, text, options = {}) {
        const {
            speed = 50,
            delay = 0,
            cursor = true,
            cursorChar = '|'
        } = options;

        return new Promise((resolve) => {
            element.textContent = '';
            
            if (cursor) {
                const cursorElement = document.createElement('span');
                cursorElement.textContent = cursorChar;
                cursorElement.className = 'typewriter-cursor';
                element.appendChild(cursorElement);
            }

            let index = 0;
            
            const type = () => {
                if (index < text.length) {
                    element.insertBefore(
                        document.createTextNode(text[index]),
                        element.lastChild
                    );
                    index++;
                    setTimeout(type, speed);
                } else {
                    if (cursor) {
                        element.lastChild.remove();
                    }
                    resolve();
                }
            };

            setTimeout(type, delay);
        });
    }

    /**
     * Count up animation
     */
    countUp(element, target, options = {}) {
        const {
            duration = 2000,
            delay = 0,
            easing = 'ease-out',
            separator = ',',
            decimals = 0
        } = options;

        return new Promise((resolve) => {
            const start = 0;
            const startTime = Date.now() + delay;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Apply easing
                const easedProgress = this.applyEasing(progress, easing);
                const current = start + (target - start) * easedProgress;
                
                element.textContent = this.formatNumber(current, separator, decimals);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            if (delay > 0) {
                setTimeout(animate, delay);
            } else {
                animate();
            }
        });
    }

    /**
     * Apply easing function
     */
    applyEasing(t, easing) {
        const easings = {
            'linear': t => t,
            'ease-in': t => t * t,
            'ease-out': t => 1 - Math.pow(1 - t, 2),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
            'bounce': t => {
                if (t < 1 / 2.75) {
                    return 7.5625 * t * t;
                } else if (t < 2 / 2.75) {
                    return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                } else if (t < 2.5 / 2.75) {
                    return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            }
        };

        return easings[easing] ? easings[easing](t) : t;
    }

    /**
     * Format number with separators
     */
    formatNumber(num, separator = ',', decimals = 0) {
        return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
    }
}

// Create global animation utils instance
window.animationUtils = new AnimationUtils();

// Add ripple animation styles
if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }

        .typewriter-cursor {
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }

        .shimmer {
            background: linear-gradient(90deg, 
                var(--color-bg-tertiary) 25%, 
                var(--color-bg-secondary) 50%, 
                var(--color-bg-tertiary) 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }

        .reduced-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    `;
    document.head.appendChild(style);
}
