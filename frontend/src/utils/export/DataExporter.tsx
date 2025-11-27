// Last Modified: 2025-11-24 21:40
/**
 * DataExporter Utility
 * Export chart data and visualizations in multiple formats
 * Features:
 * - Export visible chart data to CSV
 * - Screenshot chart as PNG (using html2canvas)
 * - Generate PDF reports with charts
 * - Schedule automated exports
 * - Email report integration ready
 */

import html2canvas from 'html2canvas';
import { format } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  includeHeaders?: boolean;
}

export interface CSVExportOptions extends ExportOptions {
  delimiter?: string;
  quote?: string;
  newline?: string;
}

export interface ImageExportOptions extends ExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

export interface PDFExportOptions extends ExportOptions {
  title?: string;
  subtitle?: string;
  includeMetadata?: boolean;
  pageSize?: 'letter' | 'a4' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

// ============================================
// CSV EXPORT
// ============================================

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: Record<string, any>[],
  options: CSVExportOptions = {}
): void => {
  const {
    filename = 'data-export',
    includeTimestamp = true,
    includeHeaders = true,
    delimiter = ',',
    quote = '"',
    newline = '\n',
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Escape and quote values if they contain special characters
    const escapeValue = (value: any): string => {
      if (value === null || value === undefined) return '';

      const stringValue = String(value);

      // Check if value needs quoting
      const needsQuoting =
        stringValue.includes(delimiter) ||
        stringValue.includes(quote) ||
        stringValue.includes(newline) ||
        stringValue.includes('\r');

      if (needsQuoting) {
        return `${quote}${stringValue.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`;
      }

      return stringValue;
    };

    // Build CSV content
    const csvRows: string[] = [];

    // Add headers
    if (includeHeaders) {
      csvRows.push(headers.map(escapeValue).join(delimiter));
    }

    // Add data rows
    data.forEach((row) => {
      const values = headers.map((header) => escapeValue(row[header]));
      csvRows.push(values.join(delimiter));
    });

    const csvContent = csvRows.join(newline);

    // Generate filename with timestamp if needed
    const finalFilename = includeTimestamp
      ? `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`
      : `${filename}.csv`;

    // Create and trigger download
    downloadFile(csvContent, finalFilename, 'text/csv');
  } catch (error) {
    console.error('CSV export failed:', error);
    throw new Error('Failed to export data to CSV');
  }
};

// ============================================
// JSON EXPORT
// ============================================

/**
 * Export data to JSON format
 */
export const exportToJSON = (
  data: any,
  options: ExportOptions = {}
): void => {
  const {
    filename = 'data-export',
    includeTimestamp = true,
  } = options;

  try {
    const jsonContent = JSON.stringify(data, null, 2);

    const finalFilename = includeTimestamp
      ? `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.json`
      : `${filename}.json`;

    downloadFile(jsonContent, finalFilename, 'application/json');
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Failed to export data to JSON');
  }
};

// ============================================
// IMAGE EXPORT
// ============================================

/**
 * Export chart/element as image
 * Note: Requires html2canvas library to be installed
 */
export const exportToImage = async (
  element: HTMLElement,
  options: ImageExportOptions = {}
): Promise<void> => {
  const {
    filename = 'chart-export',
    includeTimestamp = true,
    format: imageFormat = 'png',
    quality = 0.95,
    scale = 2,
    backgroundColor = '#ffffff',
  } = options;

  try {
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas library is required for image export');
    }

    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
    });

    // Convert to blob
    const mimeType = `image/${imageFormat}`;
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const finalFilename = includeTimestamp
        ? `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${imageFormat}`
        : `${filename}.${imageFormat}`;

      downloadBlob(blob, finalFilename);
    }, mimeType, quality);
  } catch (error) {
    console.error('Image export failed:', error);
    throw new Error('Failed to export as image');
  }
};

// ============================================
// PDF EXPORT
// ============================================

/**
 * Export data/charts as PDF
 * Note: Basic implementation - for production, use libraries like jsPDF or pdfmake
 */
export const exportToPDF = async (
  elements: HTMLElement[],
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    filename = 'report-export',
    includeTimestamp = true,
    title,
    subtitle,
    includeMetadata = true,
  } = options;

  try {
    // For now, convert to images and create a simple HTML document
    // In production, you would use jsPDF or pdfmake for proper PDF generation
    console.warn('PDF export requires additional implementation with jsPDF or pdfmake');

    // Basic implementation: Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Data Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            h2 { color: #666; }
            .metadata { color: #999; font-size: 12px; margin-bottom: 20px; }
            .chart { margin: 20px 0; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${title ? `<h1>${title}</h1>` : ''}
          ${subtitle ? `<h2>${subtitle}</h2>` : ''}
          ${includeMetadata ? `<div class="metadata">Generated on ${format(new Date(), 'PPpp')}</div>` : ''}
          <div class="content">
            ${await Promise.all(
              elements.map(async (el) => {
                const canvas = await html2canvas(el, {
                  scale: 2,
                  backgroundColor: '#ffffff',
                });
                return `<div class="chart"><img src="${canvas.toDataURL()}" style="max-width: 100%;" /></div>`;
              })
            ).then(imgs => imgs.join(''))}
          </div>
        </body>
      </html>
    `;

    const finalFilename = includeTimestamp
      ? `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.html`
      : `${filename}.html`;

    downloadFile(htmlContent, finalFilename, 'text/html');

    console.info('PDF export: Exported as HTML. For proper PDF generation, integrate jsPDF or pdfmake.');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export as PDF');
  }
};

// ============================================
// SCHEDULED EXPORT
// ============================================

export interface ScheduledExportConfig {
  format: 'csv' | 'json' | 'image' | 'pdf';
  interval: number; // milliseconds
  getData: () => any;
  getElement?: () => HTMLElement | null;
  options?: ExportOptions;
  enabled?: boolean;
}

/**
 * Schedule automatic exports at regular intervals
 */
export class ScheduledExporter {
  private intervalId: NodeJS.Timeout | null = null;
  private config: ScheduledExportConfig;

  constructor(config: ScheduledExportConfig) {
    this.config = {
      enabled: true,
      ...config,
    };
  }

  start(): void {
    if (!this.config.enabled) {
      console.warn('Scheduled export is disabled');
      return;
    }

    this.stop(); // Clear any existing interval

    this.intervalId = setInterval(async () => {
      try {
        await this.performExport();
      } catch (error) {
        console.error('Scheduled export failed:', error);
      }
    }, this.config.interval);

    console.info(`Scheduled export started: ${this.config.format} every ${this.config.interval}ms`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.info('Scheduled export stopped');
    }
  }

  async performExport(): Promise<void> {
    const { format, getData, getElement, options } = this.config;

    switch (format) {
      case 'csv':
        exportToCSV(getData(), options as CSVExportOptions);
        break;

      case 'json':
        exportToJSON(getData(), options);
        break;

      case 'image':
        const imageElement = getElement?.();
        if (imageElement) {
          await exportToImage(imageElement, options as ImageExportOptions);
        }
        break;

      case 'pdf':
        const pdfElement = getElement?.();
        if (pdfElement) {
          await exportToPDF([pdfElement], options as PDFExportOptions);
        }
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  updateConfig(updates: Partial<ScheduledExportConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart if interval changed and exporter is running
    if (updates.interval && this.intervalId) {
      this.start();
    }
  }
}

// ============================================
// EMAIL INTEGRATION (PLACEHOLDER)
// ============================================

export interface EmailReportConfig {
  to: string[];
  subject: string;
  body?: string;
  attachments: {
    filename: string;
    content: Blob | string;
    type: string;
  }[];
}

/**
 * Send report via email
 * Note: This requires backend integration
 */
export const sendEmailReport = async (config: EmailReportConfig): Promise<void> => {
  console.warn('Email integration requires backend implementation');

  // In production, this would call your backend API
  // Example:
  // const formData = new FormData();
  // config.attachments.forEach(attachment => {
  //   formData.append('attachments', attachment.content, attachment.filename);
  // });
  // formData.append('to', JSON.stringify(config.to));
  // formData.append('subject', config.subject);
  // formData.append('body', config.body || '');
  //
  // await fetch('/api/send-email-report', {
  //   method: 'POST',
  //   body: formData,
  // });

  throw new Error('Email integration not implemented');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Download a file from string content
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
};

/**
 * Download a blob as file
 */
const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  exportToCSV,
  exportToJSON,
  exportToImage,
  exportToPDF,
  ScheduledExporter,
  sendEmailReport,
};
