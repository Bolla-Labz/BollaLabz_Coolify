// Last Modified: 2025-11-24 16:15
/**
 * Ant Design Theme Configuration
 * Maps BollaLabz TailwindCSS design tokens to Ant Design theme
 * Ensures visual consistency across UI libraries
 */

import type { ThemeConfig } from 'antd';

/**
 * BollaLabz Ant Design Theme
 * Aligned with Zero Cognitive Load and Human-First Design principles
 */
export const bollaLabzTheme: ThemeConfig = {
  token: {
    // Color System - Mapped from TailwindCSS
    colorPrimary: '#3b82f6',        // primary-500 (blue)
    colorSuccess: '#22c55e',         // bolla-success-500 (green)
    colorWarning: '#eab308',         // bolla-warning-500 (yellow)
    colorError: '#ef4444',           // bolla-error-500 (red)
    colorInfo: '#3b82f6',            // primary-500 (blue)
    colorTextBase: '#111827',        // bolla-dark-900
    colorBgBase: '#ffffff',          // white

    // Typography - Matched to TailwindCSS
    fontFamily: 'Inter var, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: 16,                    // base: 1rem
    fontSizeHeading1: 48,            // 3xl: 3rem
    fontSizeHeading2: 36,            // 2xl: 2.25rem
    fontSizeHeading3: 30,            // xl: 1.875rem
    fontSizeHeading4: 24,            // lg: 1.5rem
    fontSizeHeading5: 20,            // base+: 1.25rem

    // Spacing - Matched to TailwindCSS spacing scale
    marginXS: 4,                     // spacing-1
    marginSM: 8,                     // spacing-2
    margin: 16,                      // spacing-4
    marginMD: 20,                    // spacing-5
    marginLG: 24,                    // spacing-6
    marginXL: 32,                    // spacing-8
    marginXXL: 48,                   // spacing-12

    // Border Radius - Matched to TailwindCSS
    borderRadius: 8,                 // rounded-lg
    borderRadiusLG: 12,              // rounded-xl
    borderRadiusSM: 6,               // rounded-md
    borderRadiusXS: 4,               // rounded

    // Shadows - Matched to TailwindCSS custom shadows
    boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.05)',           // soft
    boxShadowSecondary: '0 4px 16px 0 rgb(0 0 0 / 0.1)',  // medium

    // Layout
    lineHeight: 1.5,                 // line-height base
    lineWidth: 1,                    // border width
    controlHeight: 40,               // Default control height (larger for accessibility)
    controlHeightLG: 48,             // Large control height
    controlHeightSM: 32,             // Small control height
    controlHeightXS: 24,             // Extra small control height

    // Z-Index (aligned with TailwindCSS custom z-index)
    zIndexBase: 0,
    zIndexPopupBase: 1000,           // Base for overlays

    // Motion - Smooth, professional animations
    motionDurationFast: '0.2s',
    motionDurationMid: '0.3s',
    motionDurationSlow: '0.4s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
    motionEaseIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  components: {
    // DatePicker Component Overrides
    DatePicker: {
      controlHeight: 40,
      fontSize: 14,
      borderRadius: 8,
      colorBorder: 'hsl(var(--border))',
      colorPrimary: '#3b82f6',
      colorBgContainer: 'hsl(var(--background))',
    },

    // TimePicker Component Overrides
    TimePicker: {
      controlHeight: 40,
      fontSize: 14,
      borderRadius: 8,
      colorBorder: 'hsl(var(--border))',
      colorPrimary: '#3b82f6',
    },

    // Notification Component Overrides
    Notification: {
      width: 384,
      fontSize: 14,
      borderRadius: 12,
      colorBgElevated: 'hsl(var(--card))',
      colorText: 'hsl(var(--foreground))',
      colorTextHeading: 'hsl(var(--foreground))',
    },

    // Drawer Component Overrides
    Drawer: {
      fontSize: 14,
      colorBgElevated: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
    },

    // Dropdown Component Overrides
    Dropdown: {
      fontSize: 14,
      borderRadius: 8,
      controlHeight: 40,
      colorBgElevated: 'hsl(var(--popover))',
      colorText: 'hsl(var(--popover-foreground))',
      boxShadowSecondary: '0 4px 16px 0 rgb(0 0 0 / 0.1)',
    },

    // Steps Component Overrides
    Steps: {
      fontSize: 14,
      colorPrimary: '#3b82f6',
      colorText: 'hsl(var(--foreground))',
      colorTextDisabled: 'hsl(var(--muted-foreground))',
    },

    // Progress Component Overrides
    Progress: {
      fontSize: 14,
      colorText: 'hsl(var(--foreground))',
      colorSuccess: '#22c55e',
      defaultColor: '#3b82f6',
    },

    // Statistic Component Overrides
    Statistic: {
      fontSize: 14,
      titleFontSize: 14,
      contentFontSize: 24,
      colorTextHeading: 'hsl(var(--foreground))',
      colorText: 'hsl(var(--muted-foreground))',
    },
  },

  // Algorithm - Use default light theme
  algorithm: undefined, // Will use default algorithm
};

/**
 * Dark mode theme variant
 * Applied when user selects dark mode
 */
export const bollaLabzDarkTheme: ThemeConfig = {
  ...bollaLabzTheme,
  token: {
    ...bollaLabzTheme.token,
    colorTextBase: '#f9fafb',        // bolla-dark-50
    colorBgBase: '#111827',          // bolla-dark-900
  },
  algorithm: undefined, // Will use dark algorithm when needed
};

export default bollaLabzTheme;
