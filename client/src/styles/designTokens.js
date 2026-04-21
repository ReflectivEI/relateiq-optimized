/**
 * designTokens.js — Global Design System
 * Strict enforcement: Navy, Teal, White, Medium Grey, Pale Yellow only
 * All color usage must be validated against this file.
 */

export const COLORS = {
  NAVY: "#0F2A44",
  TEAL: "#2FA4A9",
  WHITE: "#FFFFFF",
  GREY: "#6B7280",
  PALE_YELLOW: "#F4E7B7",
};

export const SPACING = {
  XS: "0.25rem",
  SM: "0.5rem",
  MD: "1rem",
  LG: "1.5rem",
  XL: "2rem",
  XXL: "3rem",
};

export const BORDER_RADIUS = {
  SM: "0.5rem",
  MD: "0.75rem",
  LG: "1rem",
  XL: "1.5rem",
};

export const SHADOWS = {
  SM: "0 1px 2px rgba(0, 0, 0, 0.05)",
  MD: "0 4px 6px rgba(0, 0, 0, 0.1)",
  LG: "0 10px 15px rgba(0, 0, 0, 0.1)",
};

export const TYPOGRAPHY = {
  DISPLAY: { size: "2.5rem", weight: 700, family: "Playfair Display" },
  HEADING_1: { size: "2rem", weight: 600, family: "Playfair Display" },
  HEADING_2: { size: "1.5rem", weight: 600, family: "DM Sans" },
  HEADING_3: { size: "1.25rem", weight: 600, family: "DM Sans" },
  BODY_LG: { size: "1rem", weight: 400, family: "DM Sans" },
  BODY_MD: { size: "0.875rem", weight: 400, family: "DM Sans" },
  BODY_SM: { size: "0.75rem", weight: 400, family: "DM Sans" },
  LABEL: { size: "0.625rem", weight: 600, family: "DM Sans" },
};

/**
 * Validate color usage — enforce strict palette
 * @param {string} color — color value to validate
 * @returns {boolean} true if valid
 */
export function isValidColor(color) {
  const validColors = Object.values(COLORS);
  return validColors.includes(color) || /^(rgba?|hsl|transparent)/.test(color);
}

/**
 * Apply design token to element
 * @param {HTMLElement} el — target element
 * @param {object} tokens — { color, bg, radius, shadow, padding }
 */
export function applyDesignToken(el, tokens) {
  if (tokens.bg && isValidColor(tokens.bg)) el.style.backgroundColor = tokens.bg;
  if (tokens.color && isValidColor(tokens.color)) el.style.color = tokens.color;
  if (tokens.radius) el.style.borderRadius = BORDER_RADIUS[tokens.radius] || tokens.radius;
  if (tokens.shadow) el.style.boxShadow = SHADOWS[tokens.shadow] || tokens.shadow;
  if (tokens.padding) el.style.padding = SPACING[tokens.padding] || tokens.padding;
}

export default { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY };