// Last Modified: 2025-11-23 17:30
/**
 * BollaLabz Accessibility System
 * Comprehensive accessibility features aligned with project vision:
 * - Human-First Design: Accessible to all users
 * - Zero Cognitive Load: Automatic accessibility management
 * - Production Reliability: WCAG 2.1 AA compliance
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ============================================
// ACCESSIBILITY CONTEXT
// ============================================

interface AccessibilitySettings {
  // Visual
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

  // Interaction
  keyboardNavigation: boolean;
  focusIndicator: 'default' | 'enhanced' | 'custom';
  skipLinks: boolean;

  // Screen Reader
  announceUpdates: boolean;
  verbosityLevel: 'minimal' | 'normal' | 'verbose';

  // Preferences
  autoDetect: boolean;
}

const AccessibilityContext = React.createContext<{
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
}>({
  settings: {
    highContrast: false,
    fontSize: 'normal',
    reducedMotion: false,
    colorBlindMode: 'none',
    keyboardNavigation: true,
    focusIndicator: 'default',
    skipLinks: true,
    announceUpdates: true,
    verbosityLevel: 'normal',
    autoDetect: true,
  },
  updateSettings: () => {},
  announceMessage: () => {},
});

// ============================================
// ACCESSIBILITY PROVIDER
// ============================================

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load saved preferences
    const saved = localStorage.getItem('a11y_settings');
    if (saved) {
      return JSON.parse(saved);
    }

    // Auto-detect preferences
    return {
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      fontSize: 'normal',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      colorBlindMode: 'none',
      keyboardNavigation: true,
      focusIndicator: 'default',
      skipLinks: true,
      announceUpdates: true,
      verbosityLevel: 'normal',
      autoDetect: true,
    };
  });

  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Update settings
  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('a11y_settings', JSON.stringify(newSettings));
      applySettings(newSettings);
      return newSettings;
    });
  }, []);

  // Apply settings to document
  const applySettings = (settings: AccessibilitySettings) => {
    const html = document.documentElement;

    // High contrast
    html.classList.toggle('high-contrast', settings.highContrast);

    // Font size
    html.setAttribute('data-font-size', settings.fontSize);

    // Reduced motion
    html.classList.toggle('reduced-motion', settings.reducedMotion);

    // Color blind mode
    html.setAttribute('data-color-blind-mode', settings.colorBlindMode);

    // Focus indicator
    html.setAttribute('data-focus-indicator', settings.focusIndicator);
  };

  // Announce message to screen readers
  const announceMessage = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.announceUpdates || !liveRegionRef.current) return;

    const region = liveRegionRef.current;
    region.setAttribute('aria-live', priority);
    region.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }, [settings.announceUpdates]);

  // Auto-detect system changes
  useEffect(() => {
    if (!settings.autoDetect) return;

    const mediaQueries = [
      { query: '(prefers-contrast: high)', setting: 'highContrast' },
      { query: '(prefers-reduced-motion: reduce)', setting: 'reducedMotion' },
    ];

    const handlers = mediaQueries.map(({ query, setting }) => {
      const mq = window.matchMedia(query);
      const handler = (e: MediaQueryListEvent) => {
        updateSettings({ [setting]: e.matches });
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    });

    return () => handlers.forEach(cleanup => cleanup());
  }, [settings.autoDetect, updateSettings]);

  // Apply initial settings
  useEffect(() => {
    applySettings(settings);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, announceMessage }}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </AccessibilityContext.Provider>
  );
};

// ============================================
// SKIP LINKS COMPONENT
// ============================================

export const SkipLinks: React.FC = () => {
  const links = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#main-navigation', text: 'Skip to navigation' },
    { href: '#search', text: 'Skip to search' },
  ];

  return (
    <div className="skip-links">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          onFocus={(e) => e.currentTarget.classList.add('focused')}
          onBlur={(e) => e.currentTarget.classList.remove('focused')}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Focus trap for modals and dialogs
 */
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  returnFocus?: boolean;
}> = ({ children, active = true, returnFocus = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store previous focus
    if (returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Get focusable elements
    const getFocusableElements = () => {
      const selector = [
        'a[href]:not([disabled])',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, returnFocus]);

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  );
};

// ============================================
// KEYBOARD NAVIGATION
// ============================================

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', wrap = true, onSelect } = options;
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (items.length === 0) return;

    let newIndex = focusedIndex;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) newIndex = wrap ? maxIndex : 0;
        }
        break;

      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          e.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex > maxIndex) newIndex = wrap ? 0 : maxIndex;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) newIndex = wrap ? maxIndex : 0;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          e.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex > maxIndex) newIndex = wrap ? 0 : maxIndex;
        }
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        newIndex = maxIndex;
        break;

      case 'Enter':
      case ' ':
        if (onSelect && focusedIndex >= 0) {
          e.preventDefault();
          onSelect(focusedIndex);
        }
        break;

      default:
        return;
    }

    if (newIndex !== focusedIndex && items[newIndex]) {
      setFocusedIndex(newIndex);
      items[newIndex].focus();
    }
  }, [items, focusedIndex, orientation, wrap, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { focusedIndex, setFocusedIndex };
}

// ============================================
// ARIA LIVE ANNOUNCER
// ============================================

/**
 * Hook for announcing updates to screen readers
 */
export function useAnnouncer() {
  const { announceMessage } = React.useContext(AccessibilityContext);
  return announceMessage;
}

/**
 * Component for status messages
 */
export const StatusMessage: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  priority?: 'polite' | 'assertive';
}> = ({ message, type = 'info', priority = 'polite' }) => {
  const announce = useAnnouncer();

  useEffect(() => {
    announce(message, priority);
  }, [message, priority, announce]);

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={`status-message status-message--${type}`}
      role="status"
      aria-live={priority}
      aria-atomic="true"
    >
      <span className="status-message__icon" aria-hidden="true">
        {icons[type]}
      </span>
      <span className="status-message__text">{message}</span>
    </div>
  );
};

// ============================================
// ACCESSIBLE FORM COMPONENTS
// ============================================

/**
 * Accessible form field wrapper
 */
export const FormField: React.FC<{
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactElement;
}> = ({ label, error, required, helpText, children }) => {
  const fieldId = useRef(`field-${Math.random().toString(36).substr(2, 9)}`).current;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Clone child and add accessibility props
  const field = React.cloneElement(children, {
    id: fieldId,
    'aria-invalid': !!error,
    'aria-describedby': [
      error && errorId,
      helpText && helpId,
    ].filter(Boolean).join(' '),
    'aria-required': required,
  });

  return (
    <div className="form-field">
      <label htmlFor={fieldId} className="form-field__label">
        {label}
        {required && <span className="form-field__required" aria-label="required">*</span>}
      </label>
      {field}
      {helpText && (
        <div id={helpId} className="form-field__help">
          {helpText}
        </div>
      )}
      {error && (
        <div id={errorId} className="form-field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================
// ACCESSIBLE TABLE
// ============================================

/**
 * Accessible data table
 */
export const AccessibleTable: React.FC<{
  caption: string;
  headers: string[];
  rows: any[][];
  sortable?: boolean;
  onSort?: (columnIndex: number) => void;
}> = ({ caption, headers, rows, sortable = false, onSort }) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const announce = useAnnouncer();

  const handleSort = (index: number) => {
    const newDirection = sortColumn === index && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(index);
    setSortDirection(newDirection);

    if (onSort) {
      onSort(index);
    }

    announce(`Table sorted by ${headers[index]} in ${newDirection}ending order`);
  };

  return (
    <table role="table" aria-label={caption}>
      <caption className="table__caption">{caption}</caption>
      <thead>
        <tr role="row">
          {headers.map((header, index) => (
            <th
              key={index}
              role="columnheader"
              scope="col"
              aria-sort={
                sortColumn === index
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              {sortable ? (
                <button
                  className="table__sort-button"
                  onClick={() => handleSort(index)}
                  aria-label={`Sort by ${header}`}
                >
                  {header}
                  <span className="table__sort-indicator" aria-hidden="true">
                    {sortColumn === index && (sortDirection === 'asc' ? '↑' : '↓')}
                  </span>
                </button>
              ) : (
                header
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} role="row">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} role="cell">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================
// ACCESSIBLE MODAL
// ============================================

/**
 * Accessible modal dialog
 */
export const AccessibleModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}> = ({ isOpen, onClose, title, children, closeOnEscape = true, closeOnBackdrop = true }) => {
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`).current;
  const announce = useAnnouncer();

  useEffect(() => {
    if (isOpen) {
      announce(`${title} dialog opened`);
    }
  }, [isOpen, title, announce]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={closeOnBackdrop ? onClose : undefined}
      aria-hidden="true"
    >
      <FocusTrap active={isOpen}>
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal__header">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            <button
              className="modal__close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
          <div className="modal__body">
            {children}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

// ============================================
// ACCESSIBILITY UTILITIES
// ============================================

/**
 * Screen reader only text
 */
export const ScreenReaderOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Hook for managing focus
 */
export function useFocusManagement() {
  const saveFocus = () => {
    const element = document.activeElement as HTMLElement;
    return element;
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  const moveFocusTo = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.focus) {
      element.focus();
    }
  };

  return { saveFocus, restoreFocus, moveFocusTo };
}

/**
 * Hook for accessibility settings
 */
export function useAccessibility() {
  return React.useContext(AccessibilityContext);
}

// ============================================
// CSS STYLES
// ============================================

export const accessibilityStyles = `
/* Skip Links */
.skip-links {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 999;
}

.skip-link {
  position: absolute;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.skip-link:focus,
.skip-link.focused {
  top: 10px;
  left: 10px;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus Indicators */
[data-focus-indicator="enhanced"] *:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

[data-focus-indicator="custom"] *:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

/* High Contrast Mode */
.high-contrast {
  filter: contrast(1.2);
}

.high-contrast * {
  border-width: 2px;
}

/* Reduced Motion */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* Font Sizes */
[data-font-size="small"] { font-size: 14px; }
[data-font-size="normal"] { font-size: 16px; }
[data-font-size="large"] { font-size: 18px; }
[data-font-size="extra-large"] { font-size: 20px; }

/* Color Blind Modes */
[data-color-blind-mode="protanopia"] {
  filter: url('#protanopia-filter');
}

[data-color-blind-mode="deuteranopia"] {
  filter: url('#deuteranopia-filter');
}

[data-color-blind-mode="tritanopia"] {
  filter: url('#tritanopia-filter');
}
`;

export default {
  AccessibilityProvider,
  SkipLinks,
  FocusTrap,
  FormField,
  AccessibleTable,
  AccessibleModal,
  ScreenReaderOnly,
  StatusMessage,
  useKeyboardNavigation,
  useAnnouncer,
  useFocusManagement,
  useAccessibility,
  accessibilityStyles,
};