const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');

// Component configuration class
class ComponentConfig {
    constructor() {
        this.path = '';
        this.name = '';
        this.title = '';
        this.description = '';
        this.group = '';
        this.componentGroup = '';
        this.templateType = 'standard';
        this.componentType = 'standard';
        this.createDialog = true;
        this.createClientlib = true;
    }
}

// Predefined component templates
const COMPONENT_TEMPLATES = {
    'header': {
        name: 'Header',
        description: 'A site header component with logo and main navigation',
        html: (config) => `<!-- ${config.title} Component -->
<header class="${config.name} ${config.name}--${config.templateType}" data-sly-use.model="Please Replace Current PATH">
    <div class="${config.name}__container">
        <div class="${config.name}__logo">
            <a href="/" class="${config.name}__logo-link">
                <img src="/content/dam/${config.group}/logo.png" alt="${config.title}" class="${config.name}__logo-image">
            </a>
        </div>
        <nav class="${config.name}__navigation" data-sly-include="navigation.html"></nav>
        <div class="${config.name}__search" data-sly-include="search.html"></div>
    </div>
</header>`,
        dialog: {
            fields: [
                {
                    name: 'logoPath',
                    label: 'Logo Path',
                    type: 'pathfield',
                    required: true
                },
                {
                    name: 'showSearch',
                    label: 'Show Search',
                    type: 'checkbox',
                    defaultValue: true
                }
            ]
        },
        getClientlib: (config) => ({
            css: `.${config.name} {
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem 0;
}
.${config.name}__container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
}`,
            js: `'use strict';
// ${config.name} component JavaScript
class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.initialize();
    }

    initialize() {
        // Initialize header component
        console.log('${config.name} component initialized');
    }
}

// Initialize component when DOM is ready
function onDocumentReady() {
    const elements = document.querySelectorAll('.${config.name}');
    elements.forEach(element => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(element);
    });
}

if (document.readyState !== 'loading') {
    onDocumentReady();
} else {
    document.addEventListener('DOMContentLoaded', onDocumentReady);
}`
        })
    },
    'footer': {
        name: 'Footer',
        description: 'A site footer component with copyright and links',
        html: (config) => `<!-- ${config.title} Component -->
<footer class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <div class="${config.name}__content">
        <div class="${config.name}__copyright">
            &copy; ${new Date().getFullYear()} ${config.group}. All rights reserved.
        </div>
        <nav class="${config.name}__links" data-sly-include="footer-links.html"></nav>
    </div>
</footer>`,
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name} {
    background: #f5f5f5;
    padding: 2rem 0;
    margin-top: 2rem;
}
.${config.name}__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}`,
            js: `// ${config.name} component JavaScript
'use strict';
// Add any footer-specific JavaScript here`
        }) 
    },
    'navigation': {
        name: 'Navigation',
        description: 'A navigation menu component',
        html: (config) => `<!-- ${config.title} Component -->
<nav class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <ul class="${config.name}__menu" data-sly-list="${'$'}{model.menuItems}">
        <li class="${config.name}__item ${'$'}{item.current ? '${config.name}__item--active' : ''}">
            <a href="${'$'}{item.url}" class="${config.name}__link">${'$'}{item.title}</a>
        </li>
    </ul>
</nav>`,
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name}__menu {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1rem;
}
.${config.name}__link {
    text-decoration: none;
    color: #333;
}
.${config.name}__item--active .${config.name}__link {
    font-weight: bold;
}`,
            js: `// ${config.name} component JavaScript
'use strict';
// Add any navigation-specific JavaScript here`
        })
    },
    'hero': {
        name: 'Hero',
        description: 'A hero banner component with title, text, and call-to-action',
        html: (config) => `<!-- ${config.title} Component -->
<div class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <div class="${config.name}__container" style="background-image: url(${'$'}{model.backgroundImage});">
        <div class="${config.name}__content">
            ${config.title ? `<h1 class="${config.name}__title">${'$'}{model.title}</h1>` : ''}
            ${config.text ? `<p class="${config.name}__text">${'$'}{model.text}</p>` : ''}
            ${config.ctaText ? `
                <a href="${'$'}{model.ctaUrl || '#'}" class="${config.name}__button">
                    ${'$'}{model.ctaText}
                </a>` : ''
            }
        </div>
    </div>
</div>`,
        dialog: {
            fields: [
                {
                    name: 'title',
                    label: 'Title',
                    type: 'text',
                    required: true
                },
                {
                    name: 'text',
                    label: 'Description',
                    type: 'textarea'
                },
                {
                    name: 'backgroundImage',
                    label: 'Background Image',
                    type: 'pathfield',
                    required: true
                },
                {
                    name: 'ctaText',
                    label: 'Button Text',
                    type: 'text'
                },
                {
                    name: 'ctaUrl',
                    label: 'Button URL',
                    type: 'pathfield',
                    required: (fieldValues) => !!fieldValues.ctaText
                }
            ]
        },
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name} {
    width: 100%;
    position: relative;
    color: #fff;
    overflow: hidden;
}

.${config.name}__container {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    padding: 6rem 2rem;
    position: relative;
}

.${config.name}__container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.${config.name}__content {
    position: relative;
    max-width: 1200px;
    margin: 0 auto;
    text-align: center;
}

.${config.name}__title {
    font-size: 3rem;
    margin: 0 0 1rem;
    line-height: 1.2;
}

.${config.name}__text {
    font-size: 1.25rem;
    margin: 0 0 2rem;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.${config.name}__button {
    display: inline-block;
    padding: 0.75rem 2rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.${config.name}__button:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
}

/* Responsive styles */
@media (max-width: 768px) {
    .${config.name}__title {
        font-size: 2rem;
    }
    
    .${config.name}__text {
        font-size: 1.1rem;
    }
}`,
            js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.init();
    }

    init() {
        // Add any hero-specific JavaScript here
        console.log('${config.name} component initialized');
    }
}

// Initialize hero components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(hero => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(hero);
    });
});`
        })
    },'Pagination': {
    name: 'Pagination',
    description: 'A responsive pagination component',
    html: (config) => `<!-- ${config.title} Component -->
    <nav class="${config.name}" aria-label="${config.ariaLabel || 'Page navigation'}">
        <ul class="${config.name}__list">
            <li class="${config.name}__item ${config.name}__item--prev ${config.currentPage <= 1 ? 'disabled' : ''}">
                <a href="${config.prevUrl || '#'}" class="${config.name}__link" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                    <span class="sr-only">Previous</span>
                </a>
            </li>
            
            ${Array.from({ length: config.totalPages }, (_, i) => i + 1).map(page => `
                <li class="${config.name}__item ${page === config.currentPage ? 'active' : ''}">
                    <a href="${config.pageUrl ? config.pageUrl.replace(':page', page) : '#'}" 
                       class="${config.name}__link">
                        ${page}
                        ${page === config.currentPage ? '<span class="sr-only">(current)</span>' : ''}
                    </a>
                </li>
            `).join('')}
            
            <li class="${config.name}__item ${config.name}__item--next ${config.currentPage >= config.totalPages ? 'disabled' : ''}">
                <a href="${config.nextUrl || '#'}" class="${config.name}__link" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                    <span class="sr-only">Next</span>
                </a>
            </li>
        </ul>
    </nav>`,
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
}

.${config.name}__list {
    display: flex;
    padding-left: 0;
    list-style: none;
    border-radius: 0.25rem;
}

.${config.name}__item {
    margin: 0 0.25rem;
}

.${config.name}__link {
    position: relative;
    display: block;
    padding: 0.5rem 0.75rem;
    line-height: 1.25;
    color: #007bff;
    background-color: #fff;
    border: 1px solid #dee2e6;
    text-decoration: none;
    transition: all 0.2s ease;
}

.${config.name}__link:hover {
    color: #0056b3;
    background-color: #e9ecef;
    border-color: #dee2e6;
}

.${config.name}__item.active .${config.name}__link {
    z-index: 1;
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;
}

.${config.name}__item.disabled .${config.name}__link {
    color: #6c757d;
    pointer-events: none;
    cursor: not-allowed;
    background-color: #fff;
    border-color: #dee2e6;
}

.${config.name}__item--prev,
.${config.name}__item--next {
    .${config.name}__link {
        padding: 0.5rem 0.75rem;
    }
}

/* Responsive styles */
@media (max-width: 576px) {
    .${config.name}__item:not(.${config.name}__item--prev):not(.${config.name}__item--next) {
        display: none;
    }
    
    .${config.name}__item.active {
        display: block;
    }
    
    .${config.name}__item--prev,
    .${config.name}__item--next {
        display: block;
    }
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.list = element.querySelector('.${config.name}__list');
        this.init();
    }

    init() {
        // Handle click events on pagination links
        this.element.addEventListener('click', (e) => {
            const link = e.target.closest('.${config.name}__link');
            
            if (!link) return;
            
            const item = link.parentElement;
            
            if (item.classList.contains('disabled') || item.classList.contains('active')) {
                e.preventDefault();
                return;
            }
            
            // You could add AJAX loading here if needed
            // this.loadPage(link.href);
        });
        
        // Update active state when URL changes
        this.updateActiveState();
        window.addEventListener('popstate', () => this.updateActiveState());
    }
    
    updateActiveState() {
        const currentPage = this.getCurrentPageFromUrl();
        
        this.element.querySelectorAll('.${config.name}__item').forEach(item => {
            const link = item.querySelector('.${config.name}__link');
            if (!link) return;
            
            const pageNum = this.getPageNumberFromHref(link.getAttribute('href'));
            
            if (pageNum === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            // Update disabled state for prev/next buttons
            if (item.classList.contains('${config.name}__item--prev')) {
                item.classList.toggle('disabled', currentPage <= 1);
            } else if (item.classList.contains('${config.name}__item--next')) {
                const totalPages = this.getTotalPages();
                item.classList.toggle('disabled', currentPage >= totalPages);
            }
        });
    }
    
    getCurrentPageFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('page') || '1', 10);
    }
    
    getPageNumberFromHref(href) {
        if (!href || href === '#') return null;
        
        try {
            const url = new URL(href, window.location.origin);
            const pageParam = url.searchParams.get('page');
            return pageParam ? parseInt(pageParam, 10) : 1;
        } catch (e) {
            return null;
        }
    }
    
    getTotalPages() {
        // This would typically come from your backend
        // For demo purposes, we'll count the page items
        return this.element.querySelectorAll('.${config.name}__item:not(.${config.name}__item--prev):not(.${config.name}__item--next)').length;
    }
    
    // Example method to load a page via AJAX
    async loadPage(url) {
        try {
            // Show loading state
            this.element.classList.add('loading');
            
            // Fetch the page content
            const response = await fetch(url);
            const html = await response.text();
            
            // Parse the response (this is a simplified example)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Update the content area (you'll need to adjust the selector)
            const contentArea = document.querySelector('#content');
            if (contentArea) {
                contentArea.innerHTML = doc.querySelector('#content')?.innerHTML || 'Content not found';
            }
            
            // Update URL without page reload
            window.history.pushState({}, '', url);
            
            // Update active state
            this.updateActiveState();
            
            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('pageLoaded', { 
                detail: { url } 
            }));
            
        } catch (error) {
            console.error('Error loading page:', error);
            
            // Show error message
            const alert = document.createElement('div');
            alert.className = 'alert alert-danger';
            alert.textContent = 'Error loading page. Please try again.';
            this.element.parentNode.insertBefore(alert, this.element.nextSibling);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
            
        } finally {
            this.element.classList.remove('loading');
        }
    }
}

// Initialize pagination when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(pagination => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(pagination);
    });
});`
    })
},
'tooltip': {
    name: 'Tooltip',
    description: 'A tooltip that displays additional information on hover or focus',
    html: (config) => `<!-- ${config.title} Component -->
<div class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <button class="${config.name}__trigger" 
            aria-describedby="tooltip-${'$'}{model.id}" 
            ${'$'}{model.trigger === 'click' ? 'aria-expanded="false"' : ''}>
        ${'$'}{model.triggerText || 'Hover for tooltip'}
    </button>
    <div class="${config.name}__content" id="tooltip-${'$'}{model.id}" role="tooltip">
        <div class="${config.name}__arrow" data-popper-arrow></div>
        ${'$'}{model.content || 'Tooltip content goes here.'}
    </div>
</div>`,
    dialog: {
        fields: [
            {
                name: 'id',
                label: 'Tooltip ID',
                type: 'text',
                required: true,
                description: 'Must be unique'
            },
            {
                name: 'content',
                label: 'Content',
                type: 'richtext',
                required: true
            },
            {
                name: 'trigger',
                label: 'Trigger',
                type: 'select',
                options: [
                    { value: 'hover', text: 'Hover' },
                    { value: 'click', text: 'Click' },
                    { value: 'focus', text: 'Focus' }
                ],
                defaultValue: 'hover'
            },
            {
                name: 'position',
                label: 'Position',
                type: 'select',
                options: [
                    { value: 'top', text: 'Top' },
                    { value: 'right', text: 'Right' },
                    { value: 'bottom', text: 'Bottom' },
                    { value: 'left', text: 'Left' }
                ],
                defaultValue: 'top'
            },
            {
                name: 'theme',
                label: 'Theme',
                type: 'select',
                options: [
                    { value: 'light', text: 'Light' },
                    { value: 'dark', text: 'Dark' },
                    { value: 'primary', text: 'Primary' },
                    { value: 'success', text: 'Success' },
                    { value: 'danger', text: 'Danger' },
                    { value: 'warning', text: 'Warning' },
                    { value: 'info', text: 'Info' }
                ],
                defaultValue: 'light'
            },
            {
                name: 'arrow',
                label: 'Show Arrow',
                type: 'checkbox',
                defaultValue: true
            },
            {
                name: 'animation',
                label: 'Animation',
                type: 'select',
                options: [
                    { value: 'fade', text: 'Fade' },
                    { value: 'scale', text: 'Scale' },
                    { value: 'shift-away', text: 'Shift Away' },
                    { value: 'shift-toward', text: 'Shift Toward' },
                    { value: 'none', text: 'None' }
                ],
                defaultValue: 'fade'
            },
            {
                name: 'delay',
                label: 'Show/Hide Delay (ms)',
                type: 'number',
                defaultValue: 100,
                description: 'Delay in milliseconds before showing/hiding the tooltip'
            },
            {
                name: 'maxWidth',
                label: 'Max Width (px)',
                type: 'number',
                defaultValue: 200,
                description: 'Maximum width of the tooltip in pixels'
            }
        ]
    },
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    display: inline-block;
    position: relative;
}

/* Trigger Button */
.${config.name}__trigger {
    background: none;
    border: none;
    padding: 0.25rem 0.5rem;
    margin: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-bottom: 1px dashed currentColor;
    transition: all 0.2s ease;
}

.${config.name}__trigger:hover,
.${config.name}__trigger:focus {
    outline: none;
    color: #3b82f6;
    border-bottom-style: solid;
}

/* Tooltip Content */
.${config.name}__content {
    position: absolute;
    z-index: 9999;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    line-height: 1.5;
    max-width: ${'$'}{model.maxWidth || '200px'};
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s ease, visibility 0.2s;
    pointer-events: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

/* Arrow */
.${config.name}__arrow {
    position: absolute;
    width: 8px;
    height: 8px;
    background: inherit;
    transform: rotate(45deg);
}

/* Position Classes */
.${config.name}__content[data-popper-placement^="top"] {
    margin-bottom: 8px;
}

.${config.name}__content[data-popper-placement^="top"] .${config.name}__arrow {
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
}

.${config.name}__content[data-popper-placement^="right"] {
    margin-left: 8px;
}

.${config.name}__content[data-popper-placement^="right"] .${config.name}__arrow {
    left: -4px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
}

.${config.name}__content[data-popper-placement^="bottom"] {
    margin-top: 8px;
}

.${config.name}__content[data-popper-placement^="bottom"] .${config.name}__arrow {
    top: -4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
}

.${config.name}__content[data-popper-placement^="left"] {
    margin-right: 8px;
}

.${config.name}__content[data-popper-placement^="left"] .${config.name}__arrow {
    right: -4px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
}

/* Theme Classes */
.${config.name}__content--light {
    background-color: white;
    color: #1f2937;
    border: 1px solid #e5e7eb;
}

.${config.name}__content--dark {
    background-color: #1f2937;
    color: white;
}

.${config.name}__content--primary {
    background-color: #3b82f6;
    color: white;
}

.${config.name}__content--success {
    background-color: #10b981;
    color: white;
}

.${config.name}__content--danger {
    background-color: #ef4444;
    color: white;
}

.${config.name}__content--warning {
    background-color: #f59e0b;
    color: white;
}

.${config.name}__content--info {
    background-color: #06b6d4;
    color: white;
}

/* Animation Classes */
.${config.name}__content--fade {
    animation: fadeIn 0.2s ease-out;
}

.${config.name}__content--scale {
    transform-origin: var(--popper-transform-origin);
    animation: scaleIn 0.2s ease-out;
}

.${config.name}__content--shift-away {
    animation: shiftAway 0.2s ease-out;
}

.${config.name}__content--shift-toward {
    animation: shiftToward 0.2s ease-out;
}

/* Active State */
.${config.name}__content.is-visible {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

@keyframes shiftAway {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes shiftToward {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Responsive Adjustments */
@media (max-width: 640px) {
    .${config.name}__content {
        max-width: 90vw;
    }
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.trigger = element.querySelector('.${config.name}__trigger');
        this.tooltip = element.querySelector('.${config.name}__content');
        this.arrow = element.querySelector('.${config.name}__arrow');
        this.id = this.tooltip.id;
        this.isVisible = false;
        
        // Get options from data attributes
        this.options = {
            trigger: element.dataset.trigger || 'hover',
            position: element.dataset.position || 'top',
            theme: element.dataset.theme || 'light',
            arrow: element.dataset.arrow !== 'false',
            animation: element.dataset.animation || 'fade',
            delay: {
                show: parseInt(element.dataset.delayShow) || 100,
                hide: parseInt(element.dataset.delayHide) || 100
            },
            maxWidth: element.dataset.maxWidth || '200px'
        };
        
        this.init();
    }
    
    init() {
        // Set initial classes
        this.tooltip.classList.add(\`${config.name}__content--\${this.options.theme}\`);
        this.tooltip.classList.add(\`${config.name}__content--\${this.options.animation}\`);
        
        // Set max width
        this.tooltip.style.maxWidth = this.options.maxWidth;
        
        // Hide arrow if disabled
        if (!this.options.arrow && this.arrow) {
            this.arrow.style.display = 'none';
        }
        
        // Set up event listeners based on trigger type
        if (this.options.trigger === 'hover') {
            this.setupHoverEvents();
        } else if (this.options.trigger === 'click') {
            this.setupClickEvents();
        } else if (this.options.trigger === 'focus') {
            this.setupFocusEvents();
        }
        
        // Initialize Popper.js for positioning
        this.initPopper();
        
        // Add ARIA attributes
        this.trigger.setAttribute('aria-describedby', this.id);
    }
    
    setupHoverEvents() {
        let showTimeout, hideTimeout;
        
        this.trigger.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(() => this.show(), this.options.delay.show);
        });
        
        this.trigger.addEventListener('mouseleave', () => {
            clearTimeout(showTimeout);
            hideTimeout = setTimeout(() => this.hide(), this.options.delay.hide);
        });
        
        this.tooltip.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });
        
        this.tooltip.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => this.hide(), this.options.delay.hide);
        });
    }
    
    setupClickEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target) && this.isVisible) {
                this.hide();
            }
        });
    }
    
    setupFocusEvents() {
        this.trigger.addEventListener('focus', () => {
            this.show();
        });
        
        this.trigger.addEventListener('blur', () => {
            this.hide();
        });
    }
    
    initPopper() {
        // Check if Popper.js is loaded
        if (typeof Popper === 'undefined') {
            console.warn('Popper.js is required for tooltip positioning. Please include Popper.js in your project.');
            return;
        }
        
        this.popper = Popper.createPopper(this.trigger, this.tooltip, {
            placement: this.options.position,
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 8],
                    },
                },
                {
                    name: 'arrow',
                    options: {
                        element: this.arrow,
                    },
                },
                {
                    name: 'preventOverflow',
                    options: {
                        padding: 8,
                    },
                },
                {
                    name: 'flip',
                    options: {
                        padding: 8,
                    },
                },
            ],
        });
    }
    
    show() {
        if (this.isVisible) return;
        
        this.tooltip.classList.add('is-visible');
        this.isVisible = true;
        
        // Enable event listeners
        this.popper.setOptions((options) => ({
            ...options,
            modifiers: [
                ...options.modifiers,
                { name: 'eventListeners', enabled: true },
            ],
        }));
        
        // Update position
        this.popper.update();
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('tooltip:show'));
    }
    
    hide() {
        if (!this.isVisible) return;
        
        this.tooltip.classList.remove('is-visible');
        this.isVisible = false;
        
        // Disable event listeners
        this.popper.setOptions((options) => ({
            ...options,
            modifiers: [
                ...options.modifiers,
                { name: 'eventListeners', enabled: false },
            ],
        }));
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('tooltip:hide'));
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        // Update classes if theme or animation changed
        if (newOptions.theme) {
            this.tooltip.classList.remove(\`${config.name}__content--\${this.options.theme}\`);
            this.tooltip.classList.add(\`${config.name}__content--\${newOptions.theme}\`);
        }
        
        if (newOptions.animation) {
            this.tooltip.classList.remove(\`${config.name}__content--\${this.options.animation}\`);
            this.tooltip.classList.add(\`${config.name}__content--\${newOptions.animation}\`);
        }
        
        // Update Popper position if needed
        if (newOptions.position && this.popper) {
            this.popper.setOptions({
                placement: newOptions.position
            });
        }
    }
    
    destroy() {
        // Remove event listeners
        this.trigger.removeEventListener('mouseenter', this.show);
        this.trigger.removeEventListener('mouseleave', this.hide);
        this.trigger.removeEventListener('click', this.toggle);
        this.trigger.removeEventListener('focus', this.show);
        this.trigger.removeEventListener('blur', this.hide);
        
        // Remove tooltip from DOM
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
        
        // Destroy Popper instance
        if (this.popper) {
            this.popper.destroy();
        }
        
        // Remove ARIA attributes
        this.trigger.removeAttribute('aria-describedby');
    }
}

// Auto-initialize tooltips
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(tooltip => {
        tooltip.${config.name}Instance = new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(tooltip);
    });
});

// Example usage:
// <div class="tooltip" data-trigger="hover" data-position="top" data-theme="dark">
//   <button class="tooltip__trigger">Hover me</button>
//   <div class="tooltip__content" id="tooltip-1">Tooltip content goes here.</div>
// </div>`
    })
},
'modal': {
    name: 'Modal',
    description: 'A flexible modal/dialog component for focused content',
    html: (config) => `<!-- ${config.title} Component -->
<div class="${config.name}" id="${'$'}{model.id || 'modal'}" role="dialog" aria-modal="true" aria-hidden="true" tabindex="-1">
    <div class="${config.name}__overlay" data-close-modal></div>
    <div class="${config.name}__dialog" role="document">
        <div class="${config.name}__header">
            <h2 class="${config.name}__title" id="${'$'}{model.id || 'modal'}-title">
                ${'$'}{model.title || 'Modal Title'}
            </h2>
            <button class="${config.name}__close" aria-label="Close modal" data-close-modal>
                &times;
            </button>
        </div>
        <div class="${config.name}__content" id="${'$'}{model.id || 'modal'}-content">
            ${'$'}{model.content || '<p>Modal content goes here.</p>'}
        </div>
        <div class="${config.name}__footer">
            <button class="${config.name}__button ${config.name}__button--primary">Confirm</button>
            <button class="${config.name}__button" data-close-modal>Cancel</button>
        </div>
    </div>
</div>`,
    dialog: {
        fields: [
            {
                name: 'id',
                label: 'Modal ID',
                type: 'text',
                required: true,
                description: 'Unique ID for the modal (required for accessibility)'
            },
            {
                name: 'title',
                label: 'Title',
                type: 'text',
                required: true
            },
            {
                name: 'content',
                label: 'Content',
                type: 'richtext',
                required: true
            },
            {
                name: 'size',
                label: 'Size',
                type: 'select',
                options: [
                    { value: 'small', text: 'Small' },
                    { value: 'medium', text: 'Medium' },
                    { value: 'large', text: 'Large' },
                    { value: 'full', text: 'Full Screen' }
                ],
                defaultValue: 'medium'
            },
            {
                name: 'showCloseButton',
                label: 'Show Close Button',
                type: 'checkbox',
                defaultValue: true
            },
            {
                name: 'closeOnOverlayClick',
                label: 'Close on Overlay Click',
                type: 'checkbox',
                defaultValue: true
            },
            {
                name: 'closeOnEsc',
                label: 'Close on ESC Key',
                type: 'checkbox',
                defaultValue: true
            }
        ]
    },
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
}

.${config.name}[aria-hidden="false"] {
    display: flex;
}

.${config.name}__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1;
}

.${config.name}__dialog {
    position: relative;
    z-index: 2;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Modal Sizes */
.${config.name}--small .${config.name}__dialog {
    max-width: 400px;
}

.${config.name}--large .${config.name}__dialog {
    max-width: 900px;
}

.${config.name}--full .${config.name}__dialog {
    width: 95%;
    height: 95vh;
    max-width: none;
}

.${config.name}__header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.${config.name}__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
}

.${config.name}__close {
    background: none;
    border: none;
    font-size: 1.75rem;
    line-height: 1;
    padding: 0.5rem;
    margin: -0.5rem -0.5rem -0.5rem auto;
    cursor: pointer;
    color: #6b7280;
    transition: color 0.2s ease;
}

.${config.name}__close:hover {
    color: #1f2937;
}

.${config.name}__content {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
}

.${config.name}__footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

.${config.name}__button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
}

.${config.name}__button--primary {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.${config.name}__button--primary:hover {
    background-color: #2563eb;
    border-color: #2563eb;
}

.${config.name}__button:not(.${config.name}__button--primary):hover {
    background-color: #f9fafb;
}

/* Animations */
@keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes modalSlideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.${config.name}[aria-hidden="false"] .${config.name}__overlay {
    animation: modalFadeIn 0.3s ease-out;
}

.${config.name}[aria-hidden="false"] .${config.name}__dialog {
    animation: modalSlideIn 0.3s ease-out;
}

/* Responsive */
@media (max-width: 640px) {
    .${config.name}__dialog {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
    }
    
    .${config.name}--full .${config.name}__dialog {
        width: 100%;
        height: 100vh;
    }
    
    .${config.name}__header,
    .${config.name}__footer {
        padding: 1rem;
    }
    
    .${config.name}__content {
        padding: 1rem;
    }
    
    .${config.name}__footer {
        flex-direction: column;
    }
    
    .${config.name}__button {
        width: 100%;
    }
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.dialog = element.querySelector('.${config.name}__dialog');
        this.closeButtons = element.querySelectorAll('[data-close-modal]');
        this.overlay = element.querySelector('.${config.name}__overlay');
        this.isOpen = false;
        
        // Get options from data attributes
        this.options = {
            closeOnOverlayClick: element.dataset.closeOnOverlayClick !== 'false',
            closeOnEsc: element.dataset.closeOnEsc !== 'false',
            size: element.dataset.size || 'medium'
        };
        
        this.init();
    }
    
    init() {
        // Set initial ARIA attributes
        this.element.setAttribute('aria-hidden', 'true');
        
        // Add size class
        if (this.options.size) {
            this.element.classList.add(\`${config.name}--\${this.options.size}\`);
        }
        
        // Add event listeners
        this.closeButtons.forEach(button => {
            button.addEventListener('click', () => this.close());
        });
        
        if (this.options.closeOnOverlayClick) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
        
        if (this.options.closeOnEsc) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
        
        // Trap focus when modal is open
        this.element.addEventListener('keydown', this.trapFocus.bind(this));
    }
    
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.element.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.paddingRight = this.getScrollbarWidth() + 'px';
        
        // Focus first focusable element
        const focusable = this.getFocusableElements();
        if (focusable.length > 0) {
            focusable[0].focus();
        }
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('modal:open'));
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.element.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        document.documentElement.style.paddingRight = '';
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('modal:close'));
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    handleKeyDown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            e.preventDefault();
            this.close();
        }
        
        // Handle tab key for focus trapping
        if (e.key === 'Tab') {
            this.handleTabKey(e);
        }
    }
    
    handleTabKey(e) {
        const focusable = this.getFocusableElements();
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    }
    
    trapFocus(e) {
        if (!this.isOpen) return;
        
        const focusable = this.getFocusableElements();
        const firstFocusable = focusable[0];
        const lastFocusable = focusable[focusable.length - 1];
        
        // If no focusable elements, prevent tabbing out
        if (focusable.length === 0) {
            e.preventDefault();
            return;
        }
        
        // If focus is leaving the modal, wrap around
        if (!this.element.contains(document.activeElement)) {
            e.preventDefault();
            firstFocusable.focus();
            return;
        }
    }
    
    getFocusableElements() {
        return Array.from(this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }
    
    getScrollbarWidth() {
        // Create a temporary div to measure scrollbar width
        const scrollDiv = document.createElement('div');
        scrollDiv.style.width = '100px';
        scrollDiv.style.height = '100px';
        scrollDiv.style.overflow = 'scroll';
        scrollDiv.style.position = 'absolute';
        scrollDiv.style.top = '-9999px';
        document.body.appendChild(scrollDiv);
        
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        
        return scrollbarWidth;
    }
}

// Static method to open modal by ID
${config.name.charAt(0).toUpperCase() + config.name.slice(1)}.open = function(id) {
    const modal = document.getElementById(id);
    if (modal && modal.${config.name}Instance) {
        modal.${config.name}Instance.open();
    }
};

// Static method to close modal by ID
${config.name.charAt(0).toUpperCase() + config.name.slice(1)}.close = function(id) {
    const modal = document.getElementById(id);
    if (modal && modal.${config.name}Instance) {
        modal.${config.name}Instance.close();
    }
};

// Auto-initialize modals
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(modal => {
        // Store instance on the element for programmatic access
        modal.${config.name}Instance = new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(modal);
    });
    
    // Add click handlers for buttons that open modals
    document.querySelectorAll('[data-modal-target]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-modal-target');
            const modal = document.getElementById(targetId);
            
            if (modal && modal.${config.name}Instance) {
                modal.${config.name}Instance.open();
            }
        });
    });
});

// Example usage:
// <button data-modal-target="myModal">Open Modal</button>
// <div class="modal" id="myModal" data-size="medium" data-close-on-overlay-click="true" data-close-on-esc="true">
//   <div class="modal__overlay" data-close-modal></div>
//   <div class="modal__dialog" role="document">
//     <div class="modal__header">
//       <h2 class="modal__title">Modal Title</h2>
//       <button class="modal__close" aria-label="Close modal" data-close-modal>&times;</button>
//     </div>
//     <div class="modal__content">
//       <p>Modal content goes here.</p>
//     </div>
//     <div class="modal__footer">
//       <button class="modal__button modal__button--primary">Confirm</button>
//       <button class="modal__button" data-close-modal>Cancel</button>
//     </div>
//   </div>
// </div>`
    })
},
'Alert': {
    name: 'Alert',
    description: 'A dismissible alert message for user notifications',
    html: (config) => `<!-- ${config.title} Component -->
    <div class="${config.name} ${config.name}--${config.type || 'info'}" role="alert">
        <div class="${config.name}__content">
            ${config.title ? `<h4 class="${config.name}__title">${config.title}</h4>` : ''}
            <div class="${config.name}__message">${config.message || 'Alert message goes here...'}</div>
        </div>
        <button type="button" class="${config.name}__close" aria-label="Close alert">
            &times;
        </button>
    </div>`,
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    position: relative;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    animation: slideIn 0.3s ease-out;
}

/* Alert variants */
.${config.name}--success {
    color: #0f5132;
    background-color: #d1e7dd;
    border-color: #badbcc;
}

.${config.name}--info {
    color: #055160;
    background-color: #cff4fc;
    border-color: #b6effb;
}

.${config.name}--warning {
    color: #664d03;
    background-color: #fff3cd;
    border-color: #ffecb5;
}

.${config.name}--danger {
    color: #842029;
    background-color: #f8d7da;
    border-color: #f5c2c7;
}

.${config.name}__content {
    flex: 1;
    padding-right: 1.5rem;
}

.${config.name}__title {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 600;
}

.${config.name}__message {
    margin: 0;
    line-height: 1.5;
}

.${config.name}__close {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
    color: inherit;
    opacity: 0.5;
    padding: 0 0.25rem;
    margin: -0.5rem -0.5rem -0.5rem 0.5rem;
}

.${config.name}__close:hover {
    opacity: 0.75;
}

/* Animation */
@keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* For toast notifications */
.${config.name}--toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    max-width: 350px;
    z-index: 1080;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            autoDismiss: options.autoDismiss !== undefined ? options.autoDismiss : true,
            duration: options.duration || 5000,
            onClose: options.onClose || null
        };
        this.timeout = null;
        this.init();
    }

    init() {
        const closeButton = this.element.querySelector('.${config.name}__close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        if (this.options.autoDismiss) {
            this.setupAutoDismiss();
        }
    }

    setupAutoDismiss() {
        this.timeout = setTimeout(() => {
            this.close();
        }, this.options.duration);
    }

    close() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Add fade out animation
        this.element.style.animation = 'fadeOut 0.3s ease-out forwards';
        
        // Remove element after animation
        setTimeout(() => {
            this.element.remove();
            if (typeof this.options.onClose === 'function') {
                this.options.onClose();
            }
        }, 300);
    }

    // Static method to create and show a new alert
    static show(message, options = {}) {
        const defaultOptions = {
            type: options.type || 'info',
            title: options.title || null,
            autoDismiss: options.autoDismiss !== undefined ? options.autoDismiss : true,
            duration: options.duration || 5000,
            onClose: options.onClose || null,
            toast: options.toast || false
        };

        const alertElement = document.createElement('div');
        alertElement.className = '${config.name} ${config.name}--' + defaultOptions.type;
        if (defaultOptions.toast) {
            alertElement.classList.add('${config.name}--toast');
        }
        alertElement.setAttribute('role', 'alert');

        let titleHtml = '';
        if (defaultOptions.title) {
            titleHtml = \`<h4 class="${config.name}__title">\${defaultOptions.title}</h4>\`;
        }

        alertElement.innerHTML = \`
            <div class="${config.name}__content">
                \${titleHtml}
                <div class="${config.name}__message">\${message}</div>
            </div>
            <button type="button" class="${config.name}__close" aria-label="Close alert">
                &times;
            </button>
        \`;

        document.body.appendChild(alertElement);

        const alert = new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(alertElement, {
            autoDismiss: defaultOptions.autoDismiss,
            duration: defaultOptions.duration,
            onClose: defaultOptions.onClose
        });

        return alert;
    }
}

// Add fadeOut animation to the document
const style = document.createElement('style');
style.textContent = \`
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
\`;
document.head.appendChild(style);

// Initialize alerts when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(alert => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(alert);
    });
});

// Example usage:
// Alert.show('This is a success message!', { type: 'success', title: 'Success', toast: true });
// Alert.show('This is an error message!', { type: 'danger', title: 'Error' });`
    })
},    'Card': {
    name: 'Card',
    description: 'A flexible card component for displaying content',
    html: (config) => `<!-- ${config.title} Component -->
    <div class="${config.name}">
        ${config.image ? `
        <div class="${config.name}__image-container">
            <img src="${config.image}" alt="${config.imageAlt || 'Card image'}" class="${config.name}__image">
            ${config.badge ? `<span class="${config.name}__badge">${config.badge}</span>` : ''}
        </div>
        ` : ''}
        <div class="${config.name}__content">
            ${config.title ? `<h3 class="${config.name}__title">${config.title}</h3>` : ''}
            ${config.subtitle ? `<p class="${config.name}__subtitle">${config.subtitle}</p>` : ''}
            ${config.text ? `<div class="${config.name}__text">${config.text}</div>` : ''}
            ${config.button ? `
            <div class="${config.name}__actions">
                <a href="${config.buttonUrl || '#'}" class="${config.name}__button">${config.button}</a>
            </div>
            ` : ''}
        </div>
    </div>`,
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.${config.name}:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.${config.name}__image-container {
    position: relative;
    overflow: hidden;
    padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.${config.name}__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.${config.name}__badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #007bff;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
}

.${config.name}__content {
    padding: 1.5rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.${config.name}__title {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.${config.name}__subtitle {
    color: #6c757d;
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
}

.${config.name}__text {
    margin: 0 0 1.5rem 0;
    color: #495057;
    flex-grow: 1;
}

.${config.name}__actions {
    margin-top: auto;
}

.${config.name}__button {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 500;
    transition: background-color 0.2s ease;
}

.${config.name}__button:hover {
    background-color: #0056b3;
}`,
        js: `// ${config.name} component JavaScript
'use strict';

// Initialize any card-specific interactivity here
document.addEventListener('DOMContentLoaded', () => {
    // Example: Add click handler for card links
    document.querySelectorAll('.${config.name}').forEach(card => {
        card.addEventListener('click', (e) => {
            // Handle card click if needed
            // e.target.closest('.${config.name}__button') for button-specific handling
        });
    });
});`
    })
},
    'image': {
        name: 'Image',
        description: 'A responsive image component with alt text and caption',
        html: (config) => `<!-- ${config.title} Component -->
<figure class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <div class="${config.name}__image-container">
        <img 
            src="${'$'}{model.fileReference}" 
            alt="${'$'}{model.altText}" 
            class="${config.name}__image"
            loading="lazy"
            data-sly-test="${'$'}{model.fileReference}">
    </div>
    <figcaption class="${config.name}__caption" data-sly-test="${'$'}{model.caption}">${'$'}{model.caption}</figcaption>
</figure>`,
        dialog: {
            fields: [
                {
                    name: 'fileReference',
                    label: 'Image',
                    type: 'pathfield',
                    required: true
                },
                {
                    name: 'altText',
                    label: 'Alt Text',
                    type: 'text',
                    required: true
                },
                {
                    name: 'caption',
                    label: 'Caption',
                    type: 'text'
                },
                {
                    name: 'isDecorative',
                    label: 'Decorative Image',
                    type: 'checkbox',
                    description: 'Check if this image is purely decorative'
                }
            ]
        },
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name} {
    margin: 2rem 0;
    text-align: center;
}
.${config.name}__image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
}
.${config.name}__caption {
    margin-top: 0.5rem;
    font-style: italic;
    color: #666;
    font-size: 0.9rem;
}`,
            js: `// ${config.name} component JavaScript
'use strict';
// Add any image-specific JavaScript here`
        })
    },
    'text': {
        name: 'Text',
        description: 'A rich text component for formatted content',
        html: (config) => `<!-- ${config.title} Component -->
<div class="${config.name}" data-sly-use.model="Please Replace Current PATH"
     data-sly-include="text.html">
</div>`,
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name} {
    line-height: 1.6;
    color: #333;
}
.${config.name} h2 {
    font-size: 1.75rem;
    margin: 2rem 0 1rem;
    color: #222;
}
.${config.name} h3 {
    font-size: 1.5rem;
    margin: 1.75rem 0 0.875rem;
    color: #444;
}
.${config.name} p {
    margin: 0 0 1rem;
}
.${config.name} a {
    color: #0066cc;
    text-decoration: none;
}
.${config.name} a:hover {
    text-decoration: underline;
}`,
            js: `// ${config.name} component JavaScript
'use strict';
// Add any text-specific JavaScript here`
        })
    },
    'button': {
        name: 'Button',
        description: 'A customizable button component',
        html: (config) => `<!-- ${config.title} Component -->
<div class="${config.name}" data-sly-use.model="Please Replace Current PATH">
    <a href="${'$'}{model.link}" 
       class="${config.name}__link ${'$'}{model.variation ? '${config.name}__link--' + model.variation : ''} ${'$'}{model.size ? '${config.name}__link--' + model.size : ''}"
       target="${'$'}{model.newWindow ? '_blank' : '_self'}"
       role="button">
        ${'$'}{model.text || 'Button Text'}
    </a>
</div>`,
        dialog: {
            fields: [
                {
                    name: 'text',
                    label: 'Button Text',
                    type: 'text',
                    required: true
                },
                {
                    name: 'link',
                    label: 'Link URL',
                    type: 'pathfield',
                    required: true
                },
                {
                    name: 'variation',
                    label: 'Button Style',
                    type: 'select',
                    options: [
                        { value: 'primary', text: 'Primary' },
                        { value: 'secondary', text: 'Secondary' },
                        { value: 'outline', text: 'Outline' },
                        { value: 'ghost', text: 'Ghost' }
                    ]
                },
                {
                    name: 'size',
                    label: 'Size',
                    type: 'select',
                    options: [
                        { value: 'small', text: 'Small' },
                        { value: 'medium', text: 'Medium' },
                        { value: 'large', text: 'Large' }
                    ]
                },
                {
                    name: 'newWindow',
                    label: 'Open in new window',
                    type: 'checkbox'
                }
            ]
        },
        getClientlib: (config) => ({
            css: `/* ${config.name} component styles */
.${config.name}__link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

/* Button Variations */
.${config.name}__link--primary {
    background-color: #0073e6;
    color: white;
}
.${config.name}__link--primary:hover {
    background-color: #005bb5;
}

.${config.name}__link--secondary {
    background-color: #6c757d;
    color: white;
}
.${config.name}__link--secondary:hover {
    background-color: #5a6268;
}

.${config.name}__link--outline {
    background: transparent;
    border-color: #0073e6;
    color: #0073e6;
}
.${config.name}__link--outline:hover {
    background-color: rgba(0, 115, 230, 0.1);
}

.${config.name}__link--ghost {
    background: transparent;
    color: #0073e6;
    border: none;
}
.${config.name}__link--ghost:hover {
    text-decoration: underline;
}

/* Button Sizes */
.${config.name}__link--small {
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
}

.${config.name}__link--large {
    padding: 1rem 2rem;
    font-size: 1.1rem;
}`,
            js: `// ${config.name} component JavaScript
'use strict';
// Add any button-specific JavaScript here`
        })
    },

'Accordion': {
    name: 'Accordion',
    description: 'A collapsible content area for presenting information in a limited amount of space',
    html: (config) => `<!-- ${config.title} Component -->
    <div class="${config.name}">
        ${config.items ? config.items.map((item, index) => `
            <div class="${config.name}__item">
                <button class="${config.name}__header" 
                        id="accordion-${index}-header" 
                        aria-expanded="${index === 0 ? 'true' : 'false'}" 
                        aria-controls="accordion-${index}-panel">
                    ${item.title || `Item ${index + 1}`}
                    <span class="${config.name}__icon" aria-hidden="true">+</span>
                </button>
                <div class="${config.name}__panel" 
                     id="accordion-${index}-panel" 
                     role="region" 
                     aria-labelledby="accordion-${index}-header"
                     ${index === 0 ? '' : 'hidden'}>
                    <div class="${config.name}__content">
                        ${item.content || 'Accordion content goes here...'}
                    </div>
                </div>
            </div>
        `).join('') : ''}
    </div>`,
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    width: 100%;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    overflow: hidden;
}

.${config.name}__item {
    border-bottom: 1px solid #dee2e6;
}

.${config.name}__item:last-child {
    border-bottom: none;
}

.${config.name}__header {
    width: 100%;
    padding: 1rem 1.25rem;
    background-color: #f8f9fa;
    border: none;
    text-align: left;
    font-size: 1rem;
    font-weight: 500;
    color: #212529;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}

.${config.name}__header:hover {
    background-color: #e9ecef;
}

.${config.name}__header[aria-expanded="true"] {
    background-color: #e9ecef;
}

.${config.name}__header[aria-expanded="true"] .${config.name}__icon {
    transform: rotate(45deg);
}

.${config.name}__icon {
    font-size: 1.25rem;
    transition: transform 0.3s ease;
}

.${config.name}__panel {
    background-color: #fff;
    overflow: hidden;
    transition: height 0.3s ease;
}

.${config.name}__content {
    padding: 1.25rem;
}

/* Animation for accordion content */
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.${config.name}__panel[aria-hidden="false"] {
    animation: slideDown 0.3s ease forwards;
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.element = element;
        this.headers = Array.from(element.querySelectorAll('.${config.name}__header'));
        this.panels = Array.from(element.querySelectorAll('.${config.name}__panel'));
        this.init();
    }

    init() {
        this.headers.forEach(header => {
            header.addEventListener('click', (e) => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                const panel = header.nextElementSibling;

                if (isExpanded) {
                    this.closePanel(header, panel);
                } else {
                    // Close all other panels if accordion should only have one open at a time
                    this.headers.forEach(h => {
                        if (h !== header && h.getAttribute('aria-expanded') === 'true') {
                            this.closePanel(h, h.nextElementSibling);
                        }
                    });
                    this.openPanel(header, panel);
                }
            });

            // Keyboard navigation
            header.addEventListener('keydown', (e) => {
                const currentHeader = e.target;
                const headers = Array.from(document.querySelectorAll('.${config.name}__header'));
                const currentIndex = headers.indexOf(currentHeader);
                let nextIndex = null;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        nextIndex = (currentIndex + 1) % headers.length;
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        nextIndex = (currentIndex - 1 + headers.length) % headers.length;
                        break;
                    case 'Home':
                        e.preventDefault();
                        nextIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        nextIndex = headers.length - 1;
                        break;
                }

                if (nextIndex !== null) {
                    headers[nextIndex].focus();
                }
            });
        });
    }

    openPanel(header, panel) {
        header.setAttribute('aria-expanded', 'true');
        header.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        
        // Set explicit height for smooth animation
        panel.style.height = 'auto';
        const height = panel.offsetHeight;
        panel.style.height = '0';
        
        // Trigger reflow
        panel.offsetHeight;
        
        // Animate to full height
        panel.style.height = height + 'px';
        
        // Reset height after animation
        setTimeout(() => {
            panel.style.height = '';
        }, 300);
    }

    closePanel(header, panel) {
        header.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
    }
}

// Initialize accordions when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(accordion => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(accordion);
    });
});`
    })
},
'Form': {
    name: 'Form',
    description: 'A collection of form elements with consistent styling',
    html: (config) => `<!-- ${config.title} Component -->
    <form class="${config.name}" action="${config.action || '#'}" method="${config.method || 'POST'}">
        ${config.fields ? config.fields.map(field => {
            switch(field.type) {
                case 'text':
                case 'email':
                case 'password':
                case 'tel':
                case 'number':
                    return `
                    <div class="${config.name}__group">
                        <label for="${field.id || ''}" class="${config.name}__label">
                            ${field.label || ''}${field.required ? '<span class="required">*</span>' : ''}
                        </label>
                        <input type="${field.type}" 
                               id="${field.id || ''}" 
                               name="${field.name || ''}" 
                               class="${config.name}__input"
                               placeholder="${field.placeholder || ''}"
                               ${field.required ? 'required' : ''}
                               ${field.value ? `value="${field.value}"` : ''}>
                        ${field.helpText ? `<small class="${config.name}__help">${field.helpText}</small>` : ''}
                    </div>`;
                
                case 'textarea':
                    return `
                    <div class="${config.name}__group">
                        <label for="${field.id || ''}" class="${config.name}__label">
                            ${field.label || ''}${field.required ? '<span class="required">*</span>' : ''}
                        </label>
                        <textarea id="${field.id || ''}" 
                                 name="${field.name || ''}" 
                                 class="${config.name}__input ${config.name}__textarea"
                                 placeholder="${field.placeholder || ''}"
                                 rows="${field.rows || 4}"
                                 ${field.required ? 'required' : ''}>${field.value || ''}</textarea>
                        ${field.helpText ? `<small class="${config.name}__help">${field.helpText}</small>` : ''}
                    </div>`;
                
                case 'select':
                    return `
                    <div class="${config.name}__group">
                        <label for="${field.id || ''}" class="${config.name}__label">
                            ${field.label || ''}${field.required ? '<span class="required">*</span>' : ''}
                        </label>
                        <select id="${field.id || ''}" 
                                name="${field.name || ''}" 
                                class="${config.name}__select"
                                ${field.required ? 'required' : ''}>
                            ${field.placeholder ? `<option value="" disabled ${!field.value ? 'selected' : ''}>${field.placeholder}</option>` : ''}
                            ${field.options ? field.options.map(option => `
                                <option value="${option.value || ''}" ${field.value === option.value ? 'selected' : ''}>
                                    ${option.label || option.value}
                                </option>
                            `).join('') : ''}
                        </select>
                        ${field.helpText ? `<small class="${config.name}__help">${field.helpText}</small>` : ''}
                    </div>`;
                
                case 'checkbox':
                case 'radio':
                    return `
                    <div class="${config.name}__group ${config.name}__group--${field.type}">
                        <div class="${config.name}__${field.type}">
                            <input type="${field.type}" 
                                   id="${field.id || ''}" 
                                   name="${field.name || ''}" 
                                   class="${config.name}__${field.type}-input"
                                   ${field.checked ? 'checked' : ''}
                                   ${field.required ? 'required' : ''}
                                   ${field.value ? `value="${field.value}"` : ''}>
                            <label for="${field.id || ''}" class="${config.name}__${field.type}-label">
                                ${field.label || ''}${field.required ? '<span class="required">*</span>' : ''}
                            </label>
                        </div>
                        ${field.helpText ? `<small class="${config.name}__help">${field.helpText}</small>` : ''}
                    </div>`;
                
                case 'submit':
                    return `
                    <div class="${config.name}__group">
                        <button type="submit" class="${config.name}__submit">
                            ${field.label || 'Submit'}
                        </button>
                    </div>`;
                
                default:
                    return '';
            }
        }).join('') : ''}
    </form>`,
    getClientlib: (config) => ({
        css: `/* ${config.name} component styles */
.${config.name} {
    max-width: 100%;
    margin: 0 auto;
}

.${config.name}__group {
    margin-bottom: 1.5rem;
}

.${config.name}__label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #495057;
}

.${config.name}__input,
.${config.name}__select,
.${config.name}__textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #495057;
    background-color: #fff;
    background-clip: padding-box;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.${config.name}__input:focus,
.${config.name}__select:focus,
.${config.name}__textarea:focus {
    color: #495057;
    background-color: #fff;
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.${config.name}__textarea {
    min-height: 100px;
    resize: vertical;
}

.${config.name}__select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23333' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 16px 12px;
    padding-right: 2.25rem;
}

.${config.name}__checkbox,
.${config.name}__radio {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.${config.name}__checkbox-input,
.${config.name}__radio-input {
    margin-top: 0.25rem;
    margin-right: 0.5rem;
}

.${config.name}__checkbox-label,
.${config.name}__radio-label {
    margin-bottom: 0;
    font-weight: normal;
}

.${config.name}__submit {
    display: inline-block;
    font-weight: 500;
    color: #fff;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    background-color: #007bff;
    border: 1px solid #007bff;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, 
                border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.${config.name}__submit:hover {
    background-color: #0069d9;
    border-color: #0062cc;
}

.${config.name}__submit:focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.5);
}

.${config.name}__help {
    display: block;
    margin-top: 0.25rem;
    color: #6c757d;
    font-size: 0.875em;
}

.required {
    color: #dc3545;
    margin-left: 0.25rem;
}

/* Validation styles */
.${config.name}__input:invalid,
.${config.name}__select:invalid,
.${config.name}__textarea:invalid {
    border-color: #dc3545;
}

.${config.name}__input:invalid:focus,
.${config.name}__select:invalid:focus,
.${config.name}__textarea:invalid:focus {
    border-color: #dc3545;
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.${config.name}__error {
    display: none;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #dc3545;
}

.${config.name}__input:invalid ~ .${config.name}__error,
.${config.name}__select:invalid ~ .${config.name}__error,
.${config.name}__textarea:invalid ~ .${config.name}__error {
    display: block;
}`,
        js: `// ${config.name} component JavaScript
'use strict';

class ${config.name.charAt(0).toUpperCase() + config.name.slice(1)} {
    constructor(element) {
        this.form = element;
        this.fields = Array.from(element.elements).filter(el => 
            el.matches('input, select, textarea')
        );
        this.init();
    }

    init() {
        // Add live validation
        this.fields.forEach(field => {
            field.addEventListener('input', () => this.validateField(field));
            field.addEventListener('blur', () => this.validateField(field));
        });

        // Form submission
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        // Reset error state
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('${config.name}__error')) {
            errorElement.remove();
        }

        // Check validity
        if (!field.checkValidity()) {
            field.setCustomValidity('');
            
            if (field.validity.valueMissing) {
                field.setCustomValidity('This field is required');
            } else if (field.validity.typeMismatch) {
                if (field.type === 'email') {
                    field.setCustomValidity('Please enter a valid email address');
                } else if (field.type === 'url') {
                    field.setCustomValidity('Please enter a valid URL');
                }
            } else if (field.validity.patternMismatch) {
                field.setCustomValidity('Please match the requested format');
            } else if (field.validity.tooShort || field.validity.tooLong) {
                field.setCustomValidity(
                    \`Please enter a value between \${field.minLength} and \${field.maxLength} characters\`
                );
            } else if (field.validity.rangeUnderflow || field.validity.rangeOverflow) {
                field.setCustomValidity(
                    \`Please enter a value between \${field.min} and \${field.max}\`
                );
            } else if (field.validity.stepMismatch) {
                field.setCustomValidity(
                    \`Please enter a valid value. The nearest valid value is \${this.findNearestValidValue(field)}\`
                );
            }

            this.showError(field, field.validationMessage);
            return false;
        }

        return true;
    }

    validateForm() {
        let isValid = true;
        
        this.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showError(field, message) {
        // Remove any existing error message
        const existingError = field.nextElementSibling;
        if (existingError && existingError.classList.contains('${config.name}__error')) {
            existingError.remove();
        }

        // Create and insert error message
        const errorElement = document.createElement('div');
        errorElement.className = '${config.name}__error';
        errorElement.textContent = message;
        field.parentNode.insertBefore(errorElement, field.nextSibling);

        // Focus the field
        field.focus();
    }

    findNearestValidValue(field) {
        const value = parseFloat(field.value);
        const step = parseFloat(field.step || 1);
        const min = parseFloat(field.min || 0);
        
        // Calculate nearest step
        const steps = Math.round((value - min) / step);
        return (steps * step + min).toFixed(2);
    }
}

// Initialize forms when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.${config.name}').forEach(form => {
        new ${config.name.charAt(0).toUpperCase() + config.name.slice(1)}(form);
    });
});`
    })
},
'Breadcrumb': {
  name: 'Breadcrumb',
  description: 'A navigation aid that indicates the current page\'s location within a navigational hierarchy',

  html: (config) => `<!-- ${config.title} Component -->
  <nav class="${config.name}" aria-label="${config.ariaLabel || 'Page navigation'}">
    <ol class="${config.name}__list">
      ${config.items ? config.items.map((item, index) => `
        <li class="${config.name}__item ${index === config.items.length - 1 ? 'active' : ''}">
          ${index < config.items.length - 1 
              ? `<a href="${item.url || '#'}" class="${config.name}__link">${item.label}</a>` 
              : `<span aria-current="page">${item.label}</span>`}
        </li>
      `).join('') : ''}
    </ol>
  </nav>`,

  getClientlib: (config) => ({
    css: `/* ${config.name} component styles */
.${config.name} {
  padding: 1rem 0;
}

.${config.name}__list {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
}

.${config.name}__item {
  display: flex;
  align-items: center;
}

.${config.name}__item + .${config.name}__item::before {
  content: "/";
  padding: 0 0.5rem;
  color: #6c757d;
}

.${config.name}__link {
  color: #007bff;
  text-decoration: none;
  transition: color 0.15s ease-in-out;
}

.${config.name}__link:hover {
  color: #0056b3;
  text-decoration: underline;
}

.${config.name}__item.active {
  color: #6c757d;
}

@media (max-width: 576px) {
  .${config.name}__item {
    font-size: 0.875rem;
  }
  .${config.name}__item + .${config.name}__item::before {
    padding: 0 0.25rem;
  }
}`,

    js: `// ${config.name} component JavaScript
'use strict';

class ${config.name} {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      items: JSON.parse(element.dataset.items || '[]'),
      home: {
        label: element.dataset.homeLabel || 'Home',
        url: element.dataset.homeUrl || '/'
      },
      ...options
    };
    this.render();
  }

  render() {
    const items = [
      { label: this.options.home.label, url: this.options.home.url },
      ...this.options.items
    ];

    let html = '<ol class="${config.name}__list">';
    html += items.map((item, index) => {
      const isLast = index === items.length - 1;
      return \`
        <li class="${config.name}__item \${isLast ? 'active' : ''}">
          \${isLast 
            ? \`<span aria-current="page">\${item.label}</span>\`
            : \`<a href="\${item.url}" class="${config.name}__link">\${item.label}</a>\`}
        </li>\`;
    }).join('');
    html += '</ol>';

    this.element.innerHTML = html;
  }

  updateItems(newItems) {
    this.options.items = newItems;
    this.render();
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.${config.name}').forEach(el => {
    new ${config.name}(el);
  });
});`
  })
},


};
// Example configuration for the Form component
const formConfig = {
    title: 'Contact Form',
    action: '/submit-form',
    method: 'POST',
    fields: [
        {
            type: 'text',
            id: 'name',
            name: 'name',
            label: 'Full Name',
            placeholder: 'Enter your name',
            required: true
        },
        {
            type: 'email',
            id: 'email',
            name: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true
        },
        {
            type: 'select',
            id: 'subject',
            name: 'subject',
            label: 'Subject',
            required: true,
            options: [
                { value: '', label: 'Select a subject' },
                { value: 'support', label: 'Support' },
                { value: 'sales', label: 'Sales' },
                { value: 'general', label: 'General Inquiry' }
            ]
        },
        {
            type: 'textarea',
            id: 'message',
            name: 'message',
            label: 'Message',
            placeholder: 'Enter your message',
            rows: 5,
            required: true
        },
        {
            type: 'checkbox',
            id: 'subscribe',
            name: 'subscribe',
            label: 'Subscribe to newsletter'
        },
        {
            type: 'submit',
            label: 'Send Message'
        }
    ]
};
async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.buildAEMComponent', async function() {
        const config = new ComponentConfig();
        
        try {
            // Step 1: Select component type
            const componentTypes = Object.keys(COMPONENT_TEMPLATES).map(key => ({
                label: COMPONENT_TEMPLATES[key].name,
                description: COMPONENT_TEMPLATES[key].description,
                key: key
            }));
            
            componentTypes.unshift({
                label: 'Custom',
                description: 'Create a custom component from scratch',
                key: 'custom'
            });
            
            const selectedType = await vscode.window.showQuickPick(componentTypes, {
                placeHolder: 'Select component type',
                matchOnDescription: true
            });
            
            if (!selectedType) return;
            
            config.componentType = selectedType.key;
            const isCustom = config.componentType === 'custom';
            
            // Step 2: Get component path
            const componentPath = await vscode.window.showInputBox({
                prompt: 'Enter the absolute path for the component folder',
                placeHolder: 'e.g., /path/to/your/component',
                validateInput: validatePath
            });
            if (!componentPath) return;
            config.path = componentPath;

            // Step 3: Get component details
            const defaultName = isCustom ? '' : config.componentType;
            const componentName = await vscode.window.showInputBox({
                prompt: 'Enter component name (in camelCase)',
                value: defaultName,
                validateInput: isCustom ? validateComponentName : undefined
            });
            if (!componentName) return;
            config.name = componentName;

            // Set default title and description based on template
            const defaultTitle = isCustom ? '' : COMPONENT_TEMPLATES[config.componentType].name;
            const defaultDescription = isCustom ? '' : COMPONENT_TEMPLATES[config.componentType].description;

            // Step 4: Get component title and description
            config.title = await vscode.window.showInputBox({
                prompt: 'Enter component title',
                value: defaultTitle || toTitleCase(componentName),
                validateInput: validateRequired
            }) || defaultTitle || toTitleCase(componentName);

            config.description = await vscode.window.showInputBox({
                prompt: 'Enter component description',
                value: defaultDescription || `${config.title} Component`
            }) || defaultDescription || `${config.title} Component`;

            // Step 5: Get component group details
            config.group = await vscode.window.showInputBox({
                prompt: 'Enter component group (e.g., My Project)',
                value: 'My Project',
                validateInput: validateRequired
            }) || 'My Project';

            config.componentGroup = await vscode.window.showInputBox({
                prompt: 'Enter component group path (e.g., myproject/components)',
                value: 'myproject/components',
                validateInput: validateRequired
            }) || 'myproject/components';

            // For non-custom components, set default template type
            if (!isCustom) {
                config.templateType = config.componentType;
            } else {
                // Only show template type selection for custom components
                const templateOptions = ['Standard', 'Page', 'Container', 'Form'];
                const selectedTemplate = await vscode.window.showQuickPick(templateOptions, {
                    placeHolder: 'Select component template type'
                });
                if (!selectedTemplate) return;
                config.templateType = selectedTemplate.toLowerCase();
            }

            // Step 6: Ask for additional options
            const createDialog = await vscode.window.showQuickPick(
                ['Yes', 'No'], 
                { 
                    placeHolder: 'Create dialog for this component?',
                    ignoreFocusOut: true
                }
            ) === 'Yes';
            
            const createClientlib = await vscode.window.showQuickPick(
                ['Yes', 'No'], 
                { 
                    placeHolder: 'Create client library for this component?',
                    ignoreFocusOut: true
                }
            ) === 'Yes';

            config.createDialog = createDialog;
            config.createClientlib = createClientlib;

            // Show summary and confirm
            const summary = `Create ${config.componentType !== 'custom' ? config.componentType + ' ' : ''}component with these settings?\n\n` +
                `Name: ${config.name}\n` +
                `Title: ${config.title}\n` +
                `Path: ${config.path}\n` +
                (isCustom ? `Template: ${config.templateType}\n` : '') +
                `Create Dialog: ${createDialog ? 'Yes' : 'No'}\n` +
                `Create ClientLib: ${createClientlib ? 'Yes' : 'No'}`;

            const create = await vscode.window.showQuickPick(
                ['Create', 'Cancel'], 
                { 
                    placeHolder: summary,
                    ignoreFocusOut: true
                }
            ) === 'Create';

            if (create) {
                await buildComponent(config);
                vscode.window.showInformationMessage(`✅ Successfully created ${config.name} component!`);
            }

        } catch (error) {
            vscode.window.showErrorMessage(`❌ Error creating component: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

// Helper functions (keep the existing ones and add any new ones needed)
// ... existing helper functions ...

async function buildComponent(config) {
    const componentDir = path.join(config.path, config.name);
    
    // Create component directory
    await fs.ensureDir(componentDir);
    
    // Create .content.xml
    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" 
    xmlns:cq="http://www.day.com/jcr/cq/1.0" 
    xmlns:jcr="http://www.jcp.org/jcr/1.0"
    jcr:primaryType="cq:Component"
    jcr:title="${config.title}"
    jcr:description="${config.description}"
    componentGroup="${config.componentGroup}"
    sling:resourceSuperType="core/wcm/components/${config.templateType}/v1/${config.templateType}">
</jcr:root>`;

    await fs.writeFile(path.join(componentDir, '.content.xml'), contentXml);

    // Create _cq_editConfig.xml
    await fs.writeFile(path.join(componentDir, '_cq_editConfig.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" 
    xmlns:jcr="http://www.jcp.org/jcr/1.0"
    xmlns:nt="http://www.jcp.org/jcr/nt/1.0"
    jcr:primaryType="nt:unstructured">
    <cq:dropTargets jcr:primaryType="nt:unstructured">
        <${config.name}
            jcr:primaryType="nt:unstructured"
            accept="[${config.group}]"
            groups="[media]"
            propertyName="./fileReference"/>
    </cq:dropTargets>
</jcr:root>`);

    // Create HTML file based on component type
    let htmlContent;
    if (config.componentType !== 'custom' && COMPONENT_TEMPLATES[config.componentType]) {
        htmlContent = COMPONENT_TEMPLATES[config.componentType].html(config);
    } else {
        // Default HTML for custom components
        htmlContent = `<div class="${config.name}" data-sly-use.model="${config.componentGroup}/components/${config.name}">
    <!-- Component content goes here -->
</div>`;
    }
    
    await fs.writeFile(path.join(componentDir, `${config.name}.html`), htmlContent);

    // Create dialog if requested
    if (config.createDialog) {
        await createDialogStructure(componentDir, config);
    }

    // Create clientlib if requested
    if (config.createClientlib) {
        await createClientLibrary(componentDir, config);
    }
}

async function createDialogStructure(componentDir, config) {
    const dialogDir = path.join(componentDir, '_cq_dialog');
    await fs.ensureDir(dialogDir);
    
    let dialogFields = '';
    
    // Add template-specific fields if available
    if (config.componentType !== 'custom' && 
        COMPONENT_TEMPLATES[config.componentType] && 
        COMPONENT_TEMPLATES[config.componentType].dialog &&
        COMPONENT_TEMPLATES[config.componentType].dialog.fields) {
        
        COMPONENT_TEMPLATES[config.componentType].dialog.fields.forEach(field => {
            dialogFields += `\n                                            <${field.name} jcr:primaryType="nt:unstructured"
                                                fieldLabel="${field.label}"
                                                name="./${field.name}"`;
            
            if (field.required) {
                dialogFields += '\n                                                required="{Boolean}true"';
            }
            
            if (field.defaultValue !== undefined) {
                dialogFields += `\n                                                value="${field.defaultValue}"`;
            }
            
            dialogFields += `\n                                                sling ="${field.type || 'text'}"/>`;
        });
    }
    
    const dialogContent = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<jcr:root xmlns:sling="http://sling.apache.org/jcr/sling/1.0" \n` +
    `    xmlns:granite="http://www.adobe.com/jcr/granite/1.0"\n` +
    `    xmlns:cq="http://www.day.com/jcr/cq/1.0" \n` +
    `    xmlns:jcr="http://www.jcp.org/jcr/1.0"\n` +
    `    xmlns:nt="http://www.jcp.org/jcr/nt/1.0"\n` +
    `    jcr:primaryType="nt:unstructured"\n` +
    `    jcr:title="${config.title}"\n` +
    `    sling:resourceType="cq/gui/components/authoring/dialog">\n` +
    `    <content jcr:primaryType="nt:unstructured" sling:resourceType="granite/ui/components/coral/foundation/fixedcolumns">\n` +
    `        <items jcr:primaryType="nt:unstructured">\n` +
    `            <column jcr:primaryType="nt:unstructured" sling:resourceType="granite/ui/components/coral/foundation/container">\n` +
    `                <items jcr:primaryType="nt:unstructured">\n` +
    `                    <title jcr:primaryType="nt:unstructured"\n` +
    `                        fieldLabel="Title"\n` +
    `                        name="./jcr:title"\n` +
    `                        required="{Boolean}true"\n` +
    `                        type="text"/>${dialogFields}\n` +
    `                </items>\n` +
    `            </column>\n` +
    `                                </items>\n` +
                            `    </content>\n` +
                        `</jcr:root>`;
    
    await fs.writeFile(path.join(dialogDir, '.content.xml'), dialogContent);
}

async function createClientLibrary(componentDir, config) {
    const clientlibDir = path.join(componentDir, 'clientlibs');
    await fs.ensureDir(clientlibDir);
    
    // Create .content.xml for clientlib
    const clientlibContent = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<jcr:root xmlns:cq="http://www.day.com/jcr/cq/1.0" \n` +
    `    xmlns:jcr="http://www.jcp.org/jcr/1.0"\n` +
    `    jcr:primaryType="cq:ClientLibraryFolder"\n` +
    `    categories="[${config.componentGroup}.${config.name}]"\n` +
    `    dependencies="[${config.componentGroup}.core]"/>`;
    
    await fs.writeFile(path.join(clientlibDir, '.content.xml'), clientlibContent);
    
    // Create JS and CSS files
    await fs.writeFile(path.join(clientlibDir, 'js.txt'), '#base=js\nmain.js');
    await fs.writeFile(path.join(clientlibDir, 'css.txt'), '#base=css\nmain.css');
    
    // Create empty JS and CSS files with template content if available
    const jsDir = path.join(clientlibDir, 'js');
    const cssDir = path.join(clientlibDir, 'css');
    
    await fs.ensureDir(jsDir);
    await fs.ensureDir(cssDir);
    
    let jsContent = `// ${config.name} component JavaScript\n'use strict';\n`;
    let cssContent = `/* ${config.name} component styles */\n.${config.name} {\n    /* Add your styles here */\n}\n`;
    
    // Add template-specific content if available
    if (config.componentType !== 'custom' && 
        COMPONENT_TEMPLATES[config.componentType] && 
        COMPONENT_TEMPLATES[config.componentType].getClientlib) {
        
        const clientlib = COMPONENT_TEMPLATES[config.componentType].getClientlib(config);
        if (clientlib.js) {
            jsContent = clientlib.js;
        }
        
        if (clientlib.css) {
            cssContent = clientlib.css;
        }
    }
    
    await fs.writeFile(path.join(jsDir, 'main.js'), jsContent);
    await fs.writeFile(path.join(cssDir, 'main.css'), cssContent);
}

// Keep existing helper functions
function validatePath(value) {
    if (!value || value.trim().length === 0) {
        return 'Path cannot be empty';
    }
    if (!path.isAbsolute(value)) {
        return 'Please provide an absolute path';
    }
    return null;
}

function validateComponentName(value) {
    if (!value || value.trim().length === 0) {
        return 'Component name cannot be empty';
    }
    if (!/^[a-z][a-zA-Z0-9]*$/.test(value)) {
        return 'Component name must be in camelCase (start with lowercase, no spaces or special characters)';
    }
    return null;
}

function validateRequired(value) {
    if (!value || value.trim().length === 0) {
        return 'This field is required';
    }
    return null;
}

function toTitleCase(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, match => match.toUpperCase())
        .trim();
}

exports.activate = activate;
