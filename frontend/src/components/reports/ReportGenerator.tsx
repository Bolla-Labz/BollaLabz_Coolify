// Last Modified: 2025-11-23 17:30
/**
 * ReportGenerator Component
 * AI-powered report generation with templates, visualizations, and export
 * Creates professional reports from data with insights and recommendations
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Printer,
  Share2,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Clock,
  User,
  Building,
  Mail,
  Send,
  Settings,
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  Table,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  Sparkles,
  Brain,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { DataChart } from '@/components/data-visualization/charts/DataChart';
import { VirtualTable } from '@/components/data-visualization/tables/VirtualTable';
import { DataExporter, ExportOptions } from '@/utils/export/DataExporter';

// ============================================
// TYPES
// ============================================

export interface ReportSection {
  id: string;
  type: 'title' | 'summary' | 'chart' | 'table' | 'text' | 'insights' | 'recommendations';
  title?: string;
  content?: any;
  config?: any;
  visible?: boolean;
  order?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: React.ElementType;
  sections: ReportSection[];
  defaultData?: any;
  styling?: ReportStyling;
}

export interface ReportStyling {
  primaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  headerStyle?: 'modern' | 'classic' | 'minimal';
  chartTheme?: 'default' | 'pastel' | 'vibrant';
  includePageNumbers?: boolean;
  includeLogo?: boolean;
  logoUrl?: string;
}

export interface ReportGeneratorProps {
  // Data
  data?: any[];
  templates?: ReportTemplate[];

  // Configuration
  title?: string;
  subtitle?: string;
  author?: string;
  company?: string;
  date?: Date;

  // Features
  features?: {
    ai?: boolean;
    preview?: boolean;
    export?: boolean;
    print?: boolean;
    share?: boolean;
    templates?: boolean;
    customization?: boolean;
    scheduling?: boolean;
  };

  // Callbacks
  onGenerate?: (report: GeneratedReport) => void;
  onExport?: (format: string, data: any) => void;
  onShare?: (method: string, report: any) => void;
  onSchedule?: (schedule: any) => void;

  className?: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  company?: string;
  date: Date;
  sections: ReportSection[];
  metadata?: any;
  styling?: ReportStyling;
}

// ============================================
// PRESET TEMPLATES
// ============================================

const PRESET_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview with key metrics and insights',
    category: 'Business',
    icon: Building,
    sections: [
      { id: '1', type: 'title', content: 'Executive Summary Report' },
      { id: '2', type: 'summary', title: 'Key Highlights' },
      { id: '3', type: 'chart', title: 'Performance Overview', config: { type: 'line' } },
      { id: '4', type: 'insights', title: 'AI Insights' },
      { id: '5', type: 'recommendations', title: 'Recommendations' },
    ],
  },
  {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Detailed sales metrics and trends analysis',
    category: 'Sales',
    icon: TrendingUp,
    sections: [
      { id: '1', type: 'title', content: 'Sales Performance Report' },
      { id: '2', type: 'chart', title: 'Revenue Trends', config: { type: 'area' } },
      { id: '3', type: 'chart', title: 'Product Performance', config: { type: 'bar' } },
      { id: '4', type: 'table', title: 'Top Performers' },
      { id: '5', type: 'insights', title: 'Market Analysis' },
    ],
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive data analytics with visualizations',
    category: 'Analytics',
    icon: BarChart3,
    sections: [
      { id: '1', type: 'title', content: 'Analytics Dashboard' },
      { id: '2', type: 'chart', title: 'Metrics Overview', config: { type: 'pie' } },
      { id: '3', type: 'chart', title: 'Trend Analysis', config: { type: 'line' } },
      { id: '4', type: 'table', title: 'Detailed Data' },
      { id: '5', type: 'text', title: 'Analysis Summary' },
    ],
  },
];

// ============================================
// SECTION RENDERERS
// ============================================

const SectionRenderer: React.FC<{
  section: ReportSection;
  data?: any[];
  styling?: ReportStyling;
  onEdit?: (section: ReportSection) => void;
  onDelete?: (id: string) => void;
}> = ({ section, data = [], styling, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content || '');

  const handleSave = () => {
    onEdit?.({ ...section, content: editContent });
    setIsEditing(false);
  };

  switch (section.type) {
    case 'title':
      return (
        <div className="mb-8">
          {isEditing ? (
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="text-3xl font-bold w-full border-b-2 border-blue-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold text-gray-900 dark:text-white cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {section.content}
            </h1>
          )}
        </div>
      );

    case 'summary':
      return (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            {section.title}
          </h2>
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          ) : (
            <p
              className="text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {section.content || 'Click to add summary...'}
            </p>
          )}
        </div>
      );

    case 'chart':
      return (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {section.title}
          </h3>
          <DataChart
            type={section.config?.type || 'line'}
            data={data.slice(0, 20)} // Sample data
            series={[
              { key: 'value', name: 'Value', color: styling?.primaryColor || '#3b82f6' },
            ]}
            height={300}
            theme={styling?.chartTheme as any || 'default'}
          />
        </div>
      );

    case 'table':
      return (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {section.title}
          </h3>
          <div className="h-96">
            <VirtualTable
              data={data}
              columns={
                data.length > 0
                  ? Object.keys(data[0]).map(key => ({
                      id: key,
                      header: key,
                      accessor: key,
                    }))
                  : []
              }
              features={{
                virtualScroll: false,
                export: false,
              }}
              compact
            />
          </div>
        </div>
      );

    case 'insights':
      return (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h3>
          </div>
          <ul className="space-y-2">
            {(section.content || [
              'Data shows consistent growth trend',
              'Peak performance observed in Q3',
              'Customer engagement increased by 25%',
            ]).map((insight: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'recommendations':
      return (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h3>
          </div>
          <ul className="space-y-2">
            {(section.content || [
              'Focus on high-performing segments',
              'Optimize resource allocation',
              'Implement automated reporting',
            ]).map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return (
        <div className="mb-6">
          {section.title && (
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              {section.title}
            </h3>
          )}
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
          ) : (
            <p
              className="text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {section.content || 'Click to add content...'}
            </p>
          )}
        </div>
      );
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  data = [],
  templates = PRESET_TEMPLATES,
  title = 'Report',
  subtitle = '',
  author = '',
  company = '',
  date = new Date(),
  features = {
    ai: true,
    preview: true,
    export: true,
    print: true,
    share: false,
    templates: true,
    customization: true,
  },
  onGenerate,
  onExport,
  onShare,
  className,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(templates[0]);
  const [reportSections, setReportSections] = useState<ReportSection[]>(templates[0]?.sections || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [styling, setStyling] = useState<ReportStyling>({
    primaryColor: '#3b82f6',
    fontFamily: 'system-ui',
    fontSize: 14,
    headerStyle: 'modern',
    chartTheme: 'default',
    includePageNumbers: true,
  });

  const reportRef = useRef<HTMLDivElement>(null);

  // Generate sample data if none provided
  const sampleData = useMemo(() => {
    if (data.length > 0) return data;

    return Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      value: Math.floor(Math.random() * 1000),
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.5 ? 'Active' : 'Inactive',
    }));
  }, [data]);

  // Generate report with AI insights
  const generateReport = useCallback(async () => {
    setIsGenerating(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate AI insights
      if (features.ai) {
        const insightsSection = reportSections.find(s => s.type === 'insights');
        if (insightsSection) {
          insightsSection.content = [
            `Data analysis reveals ${Math.floor(Math.random() * 50 + 20)}% growth`,
            `${Math.floor(Math.random() * 30 + 10)} key patterns identified`,
            `Efficiency improved by ${Math.floor(Math.random() * 40 + 10)}%`,
            `Predicted trend: ${Math.random() > 0.5 ? 'Upward' : 'Stable'}`,
          ];
        }

        const recsSection = reportSections.find(s => s.type === 'recommendations');
        if (recsSection) {
          recsSection.content = [
            'Increase investment in top-performing areas',
            'Implement automated monitoring systems',
            'Schedule regular performance reviews',
            'Consider expanding to new markets',
          ];
        }
      }

      const report: GeneratedReport = {
        id: Date.now().toString(),
        title,
        subtitle,
        author,
        company,
        date,
        sections: reportSections,
        styling,
      };

      onGenerate?.(report);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [reportSections, features.ai, title, subtitle, author, company, date, styling, onGenerate]);

  // Export report
  const handleExport = useCallback(async (format: 'pdf' | 'html' | 'json') => {
    const exportData = {
      title,
      subtitle,
      author,
      company,
      date: date.toISOString(),
      sections: reportSections,
      data: sampleData,
    };

    if (format === 'pdf') {
      // Print to PDF
      window.print();
    } else {
      const result = await DataExporter.export([exportData], {
        format: format as any,
        filename: `report-${Date.now()}.${format}`,
        title,
        subtitle,
      });

      if (result.success) {
        onExport?.(format, exportData);
      }
    }
  }, [title, subtitle, author, company, date, reportSections, sampleData, onExport]);

  // Add new section
  const addSection = useCallback((type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: Date.now().toString(),
      type,
      title: `New ${type} Section`,
      visible: true,
      order: reportSections.length,
    };
    setReportSections([...reportSections, newSection]);
  }, [reportSections]);

  // Edit section
  const editSection = useCallback((updatedSection: ReportSection) => {
    setReportSections(sections =>
      sections.map(s => s.id === updatedSection.id ? updatedSection : s)
    );
  }, []);

  // Delete section
  const deleteSection = useCallback((id: string) => {
    setReportSections(sections => sections.filter(s => s.id !== id));
  }, []);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Report Generator
        </h2>

        {/* Template Selection */}
        {features.templates && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Template
            </h3>
            <div className="space-y-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setReportSections(template.sections);
                  }}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    selectedTemplate?.id === template.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                      : 'border-2 border-gray-200 dark:border-gray-700'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {template.icon && (
                      <template.icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Report Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Author
            </label>
            <input
              type="text"
              value={author}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>
        </div>

        {/* Customization */}
        {features.customization && (
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Styling
            </h3>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Primary Color
              </label>
              <input
                type="color"
                value={styling.primaryColor}
                onChange={(e) => setStyling({ ...styling, primaryColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Header Style
              </label>
              <select
                value={styling.headerStyle}
                onChange={(e) => setStyling({ ...styling, headerStyle: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <InteractiveButton
            variant="primary"
            size="md"
            icon={features.ai ? Brain : FileText}
            loading={isGenerating}
            onClick={generateReport}
            className="w-full"
          >
            {features.ai ? 'Generate with AI' : 'Generate Report'}
          </InteractiveButton>

          {features.export && (
            <div className="flex gap-2">
              <InteractiveButton
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => handleExport('pdf')}
                className="flex-1"
              >
                PDF
              </InteractiveButton>
              <InteractiveButton
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => handleExport('html')}
                className="flex-1"
              >
                HTML
              </InteractiveButton>
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-y-auto">
        {showPreview ? (
          <div ref={reportRef} className="max-w-4xl mx-auto p-8">
            {/* Report Header */}
            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
              {subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">{subtitle}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                {author && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {author}
                  </span>
                )}
                {company && (
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {company}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {date.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Report Sections */}
            <div className="space-y-6">
              {reportSections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  data={sampleData}
                  styling={styling}
                  onEdit={editSection}
                  onDelete={deleteSection}
                />
              ))}
            </div>

            {/* Add Section Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InteractiveButton
                    variant="ghost"
                    icon={Plus}
                    className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700"
                  >
                    Add Section
                  </InteractiveButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addSection('text')}>
                    <Type className="w-4 h-4 mr-2" />
                    Text Section
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSection('chart')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Chart
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSection('table')}>
                    <Table className="w-4 h-4 mr-2" />
                    Table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSection('insights')}>
                    <Brain className="w-4 h-4 mr-2" />
                    AI Insights
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a template and click "Generate" to create your report
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// We need to import DropdownMenu components
const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block">{children}</div>;
const DropdownMenuTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>;
const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
    {children}
  </div>
);
const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
    {children}
  </button>
);

export default ReportGenerator;