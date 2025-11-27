// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Dropdown Component
 * Wraps Ant Design Dropdown with TailwindCSS className support
 */

import React from 'react';
import { Dropdown, type DropdownProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';

export type MenuItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

export type MenuItemGroup = {
  type: 'group';
  label: React.ReactNode;
  children: MenuItem[];
};

export type MenuItemDivider = {
  type: 'divider';
};

export type MenuItemType = MenuItem | MenuItemGroup | MenuItemDivider;

export interface AntDropdownProps extends Omit<DropdownProps, 'menu'> {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Menu items configuration
   */
  items: MenuItemType[];

  /**
   * Trigger element(s)
   */
  children: React.ReactNode;

  /**
   * Trigger mode
   * @default ['hover']
   */
  trigger?: ('click' | 'hover' | 'contextMenu')[];

  /**
   * Dropdown placement
   * @default 'bottomLeft'
   */
  placement?: 'topLeft' | 'topCenter' | 'topRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight';

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Arrow indicator
   * @default false
   */
  arrow?: boolean;
}

/**
 * Dropdown Component
 *
 * Enhanced dropdown menu with context actions.
 * Aligns with "Human-First Design" by providing clear, accessible actions.
 *
 * @example
 * ```tsx
 * <AntDropdown
 *   items={[
 *     { key: 'edit', label: 'Edit Contact', icon: <EditIcon /> },
 *     { key: 'delete', label: 'Delete', danger: true, onClick: handleDelete },
 *     { type: 'divider' },
 *     { key: 'archive', label: 'Archive' },
 *   ]}
 *   trigger={['click']}
 * >
 *   <button>Actions</button>
 * </AntDropdown>
 * ```
 */
export const AntDropdown: React.FC<AntDropdownProps> = ({
  className,
  items,
  trigger = ['hover'],
  placement = 'bottomLeft',
  arrow = false,
  children,
  ...props
}) => {
  // Transform items to Ant Design menu format
  const menuItems = items.map((item) => {
    if ('type' in item) {
      if (item.type === 'divider') {
        return { type: 'divider' as const };
      }
      if (item.type === 'group') {
        return {
          type: 'group' as const,
          label: item.label,
          children: item.children,
        };
      }
    }
    return item;
  });

  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <Dropdown
        {...props}
        menu={{ items: menuItems }}
        trigger={trigger}
        placement={placement}
        arrow={arrow}
        overlayClassName={cn(
          // Ensure dropdown aligns with design system
          'bolla-dropdown',
          className
        )}
      >
        <div className={cn('inline-flex cursor-pointer')}>
          {children}
        </div>
      </Dropdown>
    </ConfigProvider>
  );
};

export default AntDropdown;
