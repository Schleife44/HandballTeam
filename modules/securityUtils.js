/**
 * modules/securityUtils.js
 * Utilities for security-related tasks, such as HTML sanitization.
 */

/**
 * Sanitizes an HTML string to prevent XSS attacks.
 * Removes dangerous tags like <script>, <iframe>, <object>, <embed>, <style>
 * and attributes like onmouseover, onclick, etc.
 * 
 * @param {string} html - The HTML string to sanitize.
 * @returns {string} - The sanitized HTML string.
 */
export function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';

    // If the string doesn't contain any HTML tags, just return it
    if (!/<[a-z][\s\S]*>/i.test(html)) return html;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => {
        // Remove script tags and other dangerous elements
        const dangerousTags = ['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'APPLET', 'BASE', 'LINK', 'META'];
        if (dangerousTags.includes(node.nodeName)) {
            node.remove();
            return;
        }

        // Remove dangerous attributes (on*, javascript:, etc.)
        if (node.attributes) {
            for (let i = node.attributes.length - 1; i >= 0; i--) {
                const attr = node.attributes[i];
                const name = attr.name.toLowerCase();
                const value = attr.value.toLowerCase();

                if (name.startsWith('on') || value.includes('javascript:') || value.includes('data:text/html')) {
                    node.removeAttribute(attr.name);
                }
            }
        }

        // Recursively walk through child nodes
        for (let i = node.childNodes.length - 1; i >= 0; i--) {
            walk(node.childNodes[i]);
        }
    };

    walk(doc.body);
    return doc.body.innerHTML;
}

/**
 * Escapes characters for use in HTML to prevent XSS.
 * Use this when you want to treat data as plain text.
 * 
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const text = String(str);
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
