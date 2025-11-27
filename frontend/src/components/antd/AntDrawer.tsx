// Last Modified: 2025-11-24 16:15
/**
 * BollaLabz Drawer Component
 * Wraps Ant Design Drawer with TailwindCSS className support
 */

import React from 'react';
import { Drawer, type DrawerProps } from '@/lib/antd/imports';
import { ConfigProvider } from '@/lib/antd/imports';
import { bollaLabzTheme } from '@/lib/antd/theme';
import { cn } from '@/lib/utils';

export interface AntDrawerProps extends DrawerProps {
  /**
   * TailwindCSS className for additional styling
   */
  className?: string;

  /**
   * Drawer title
   */
  title?: React.ReactNode;

  /**
   * Visibility control
   */
  open: boolean;

  /**
   * Close handler
   */
  onClose: () => void;

  /**
   * Drawer placement
   * @default 'right'
   */
  placement?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * Drawer width (for left/right) or height (for top/bottom)
   * @default 378
   */
  width?: number | string;
  height?: number | string;

  /**
   * Show mask (overlay)
   * @default true
   */
  mask?: boolean;

  /**
   * Close on mask click
   * @default true
   */
  maskClosable?: boolean;

  /**
   * Drawer content
   */
  children?: React.ReactNode;

  /**
   * Footer content
   */
  footer?: React.ReactNode;

  /**
   * Extra content in header
   */
  extra?: React.ReactNode;
}

/**
 * Drawer Component
 *
 * Side panel for displaying detailed information, forms, or navigation.
 * Aligns with "Context Everywhere" principle by showing related details without navigation.
 *
 * @example
 * ```tsx
 * <AntDrawer
 *   title="Contact Details"
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   className="custom-drawer"
 * >
 *   <ContactForm contact={selectedContact} />
 * </AntDrawer>
 * ```
 */
export const AntDrawer: React.FC<AntDrawerProps> = ({
  className,
  placement = 'right',
  width = 378,
  mask = true,
  maskClosable = true,
  ...props
}) => {
  return (
    <ConfigProvider theme={bollaLabzTheme}>
      <Drawer
        {...props}
        placement={placement}
        width={width}
        mask={mask}
        maskClosable={maskClosable}
        rootClassName={cn(
          // Ensure drawer aligns with design system
          'bolla-drawer',
          className
        )}
        styles={{
          body: {
            padding: '24px',
          },
          header: {
            borderBottom: '1px solid hsl(var(--border))',
            padding: '16px 24px',
          },
          footer: {
            borderTop: '1px solid hsl(var(--border))',
            padding: '16px 24px',
          },
        }}
      />
    </ConfigProvider>
  );
};

export default AntDrawer;
