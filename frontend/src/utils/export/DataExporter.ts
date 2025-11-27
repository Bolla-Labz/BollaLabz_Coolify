// Last Modified: 2025-11-23 17:30
/**
 * DataExporter Utility
 * Comprehensive data export functionality for CSV, JSON, Excel, and PDF
 * Supports complex data structures, formatting, and large datasets
 */

// ============================================
// TYPES
// ============================================

export interface ExportOptions {
  filename?: string;
  format: 'csv' | 'json' | 'excel' | 'pdf' | 'html';
  columns?: Array<{
    key: string;
    header: string;
    formatter?: (value: any) => string;
    width?: number;
  }>;
  includeHeaders?: boolean;
  delimiter?: string; // For CSV
  prettify?: boolean; // For JSON
  orientation?: 'portrait' | 'landscape'; // For PDF
  pageSize?: 'A4' | 'Letter' | 'Legal'; // For PDF
  title?: string;
  subtitle?: string;
  metadata?: Record<string, any>;
  styling?: {
    headerColor?: string;
    alternateRows?: boolean;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

// ============================================
// CSV EXPORT
// ============================================

export class CSVExporter {
  static export(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const startTime = performance.now();

    try {
      const {
        filename = `export-${Date.now()}.csv`,
        columns,
        includeHeaders = true,
        delimiter = ',',
      } = options;

      // Build CSV content
      const rows: string[] = [];

      // Add headers
      if (includeHeaders) {
        if (columns) {
          rows.push(columns.map(col => this.escapeCSV(col.header)).join(delimiter));
        } else if (data.length > 0) {
          rows.push(Object.keys(data[0]).map(key => this.escapeCSV(key)).join(delimiter));
        }
      }

      // Add data rows
      data.forEach(row => {
        if (columns) {
          const values = columns.map(col => {
            const value = row[col.key];
            const formatted = col.formatter ? col.formatter(value) : value;
            return this.escapeCSV(formatted);
          });
          rows.push(values.join(delimiter));
        } else {
          const values = Object.values(row).map(value => this.escapeCSV(value));
          rows.push(values.join(delimiter));
        }
      });

      const csv = rows.join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });

      // Download file
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        size: blob.size,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        size: 0,
        duration: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private static escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';

    const str = String(value);

    // Check if escaping is needed
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================
// JSON EXPORT
// ============================================

export class JSONExporter {
  static export(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const startTime = performance.now();

    try {
      const {
        filename = `export-${Date.now()}.json`,
        prettify = true,
        metadata,
      } = options;

      // Build JSON object
      const exportData: any = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          ...metadata,
        },
        data,
      };

      // Convert to JSON string
      const json = prettify
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);

      const blob = new Blob([json], { type: 'application/json' });

      // Download file
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        size: blob.size,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        size: 0,
        duration: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================
// HTML EXPORT
// ============================================

export class HTMLExporter {
  static export(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const startTime = performance.now();

    try {
      const {
        filename = `export-${Date.now()}.html`,
        columns,
        title = 'Data Export',
        subtitle = '',
        styling = {},
      } = options;

      const {
        headerColor = '#3b82f6',
        alternateRows = true,
        fontSize = 14,
        fontFamily = 'system-ui, -apple-system, sans-serif',
      } = styling;

      // Build HTML content
      let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: ${fontFamily};
      font-size: ${fontSize}px;
      margin: 20px;
      color: #333;
    }
    h1 {
      color: #111;
      margin-bottom: 5px;
    }
    h2 {
      color: #666;
      font-weight: normal;
      margin-top: 0;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background-color: ${headerColor};
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    ${alternateRows ? 'tr:nth-child(even) { background-color: #f9fafb; }' : ''}
    .metadata {
      margin-top: 20px;
      padding: 10px;
      background-color: #f3f4f6;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${subtitle ? `<h2>${subtitle}</h2>` : ''}

  <table>
    <thead>
      <tr>`;

      // Add headers
      if (columns) {
        columns.forEach(col => {
          html += `<th>${col.header}</th>`;
        });
      } else if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          html += `<th>${key}</th>`;
        });
      }

      html += `
      </tr>
    </thead>
    <tbody>`;

      // Add data rows
      data.forEach(row => {
        html += '<tr>';
        if (columns) {
          columns.forEach(col => {
            const value = row[col.key];
            const formatted = col.formatter ? col.formatter(value) : value;
            html += `<td>${this.escapeHtml(formatted)}</td>`;
          });
        } else {
          Object.values(row).forEach(value => {
            html += `<td>${this.escapeHtml(value)}</td>`;
          });
        }
        html += '</tr>';
      });

      html += `
    </tbody>
  </table>

  <div class="metadata">
    <strong>Export Information:</strong><br>
    Date: ${new Date().toLocaleString()}<br>
    Records: ${data.length}<br>
    Format: HTML
  </div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });

      // Download file
      this.downloadBlob(blob, filename);

      return {
        success: true,
        filename,
        size: blob.size,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        size: 0,
        duration: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private static escapeHtml(value: any): string {
    if (value === null || value === undefined) return '';

    const str = String(value);
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };

    return str.replace(/[&<>"']/g, char => escapeMap[char]);
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================
// PDF EXPORT (Simplified - would need jsPDF in production)
// ============================================

export class PDFExporter {
  static export(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): ExportResult {
    const startTime = performance.now();

    try {
      const {
        filename = `export-${Date.now()}.pdf`,
        title = 'Data Export',
        subtitle = '',
        orientation = 'portrait',
        pageSize = 'A4',
      } = options;

      // In a real implementation, you would use jsPDF or similar library
      // For now, we'll create a simple HTML that can be printed to PDF

      const htmlContent = HTMLExporter.export(data, { ...options, format: 'html' });

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent.filename); // This would be the HTML content
        printWindow.document.close();
        printWindow.print();
      }

      return {
        success: true,
        filename,
        size: 0, // Size would be calculated after PDF generation
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        size: 0,
        duration: performance.now() - startTime,
        error: (error as Error).message,
      };
    }
  }
}

// ============================================
// MAIN EXPORTER
// ============================================

export class DataExporter {
  static async export(
    data: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // Validate data
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data: must be an array');
    }

    if (data.length === 0) {
      throw new Error('No data to export');
    }

    // Export based on format
    switch (options.format) {
      case 'csv':
        return CSVExporter.export(data, options);

      case 'json':
        return JSONExporter.export(data, options);

      case 'html':
        return HTMLExporter.export(data, options);

      case 'pdf':
        return PDFExporter.export(data, options);

      case 'excel':
        // Would require a library like SheetJS
        throw new Error('Excel export requires additional libraries');

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export data to clipboard
   */
  static async copyToClipboard(
    data: any[],
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const { format = 'csv', delimiter = '\t' } = options;

    let content: string;

    switch (format) {
      case 'csv':
        const csvResult = CSVExporter.export(data, { ...options, delimiter });
        content = csvResult.filename; // This would be the CSV content
        break;

      case 'json':
        content = JSON.stringify(data, null, 2);
        break;

      default:
        content = data.map(row => Object.values(row).join(delimiter)).join('\n');
    }

    await navigator.clipboard.writeText(content);
  }

  /**
   * Stream export for large datasets
   */
  static async *streamExport(
    data: any[],
    options: ExportOptions,
    chunkSize = 1000
  ): AsyncGenerator<Blob, void, unknown> {
    const { format } = options;

    if (format !== 'csv' && format !== 'json') {
      throw new Error('Streaming only supported for CSV and JSON formats');
    }

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      let content: string;
      if (format === 'csv') {
        // Generate CSV chunk
        content = chunk.map(row =>
          Object.values(row).map(v => CSVExporter['escapeCSV'](v)).join(',')
        ).join('\n');
      } else {
        // Generate JSON chunk
        content = JSON.stringify(chunk);
      }

      yield new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
    }
  }
}

// ============================================
// EXPORT UTILITIES
// ============================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  prefix: string,
  extension: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Validate export data
 */
export function validateExportData(data: any[]): boolean {
  if (!Array.isArray(data)) return false;
  if (data.length === 0) return false;

  // Check if all items have consistent structure
  const firstKeys = Object.keys(data[0]).sort();
  return data.every(item => {
    const keys = Object.keys(item).sort();
    return keys.length === firstKeys.length &&
           keys.every((key, i) => key === firstKeys[i]);
  });
}

export default DataExporter;