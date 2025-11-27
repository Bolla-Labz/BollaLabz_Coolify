// Last Modified: 2025-11-23 17:30
/**
 * DataVisualizationExamples Component
 * Usage examples and documentation for all data visualization components
 */

import React, { useState, useMemo } from 'react';
import { DataChart } from '@/components/data-visualization/charts/DataChart';
import { VirtualTable } from '@/components/data-visualization/tables/VirtualTable';
import { RealtimeMetrics, PRESET_METRICS } from '@/components/data-visualization/dashboard/RealtimeMetrics';
import { AIChatInterface } from '@/components/ai/chat/AIChatInterface';
import { VoiceAIControl } from '@/components/ai/voice/VoiceAIControl';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { Code, Copy, CheckCircle } from 'lucide-react';

// ============================================
// SAMPLE DATA GENERATORS
// ============================================

const generateTimeSeriesData = (points: number = 30) => {
  return Array.from({ length: points }, (_, i) => ({
    date: new Date(Date.now() - (points - i) * 86400000).toLocaleDateString(),
    revenue: Math.floor(Math.random() * 5000) + 10000,
    users: Math.floor(Math.random() * 1000) + 2000,
    orders: Math.floor(Math.random() * 200) + 100,
    conversion: Number((Math.random() * 5 + 2).toFixed(2)),
  }));
};

const generateTableData = (rows: number = 100) => {
  const statuses = ['Active', 'Pending', 'Completed', 'Failed'];
  const categories = ['Product A', 'Product B', 'Product C', 'Product D'];

  return Array.from({ length: rows }, (_, i) => ({
    id: i + 1,
    name: `Customer ${i + 1}`,
    email: `customer${i + 1}@example.com`,
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    revenue: Math.floor(Math.random() * 10000),
    lastActivity: new Date(Date.now() - Math.random() * 30 * 86400000).toLocaleDateString(),
    score: Math.floor(Math.random() * 100),
  }));
};

// ============================================
// CODE EXAMPLE COMPONENT
// ============================================

const CodeExample: React.FC<{
  code: string;
  language?: string;
  title?: string;
}> = ({ code, language = 'typescript', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-8">
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          {title}
        </h3>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code className="text-sm font-mono">{code}</code>
        </pre>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DataVisualizationExamples: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'charts' | 'tables' | 'dashboard' | 'ai' | 'reports'>('charts');

  const timeSeriesData = useMemo(() => generateTimeSeriesData(), []);
  const tableData = useMemo(() => generateTableData(10000), []);

  const tabs = [
    { id: 'charts', label: 'Charts' },
    { id: 'tables', label: 'Tables' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ai', label: 'AI Features' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Data Visualization Components
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Complete examples and documentation for BollaLabz data visualization components
      </p>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts Examples */}
      {activeTab === 'charts' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              DataChart Component
            </h2>

            {/* Line Chart Example */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Line Chart with Real-time Updates
              </h3>
              <DataChart
                type="line"
                data={timeSeriesData}
                title="Revenue Trends"
                subtitle="Last 30 days performance"
                xAxis={{
                  key: 'date',
                  label: 'Date',
                  type: 'category',
                }}
                yAxis={{
                  key: 'revenue',
                  label: 'Revenue ($)',
                  format: (v) => `$${v.toLocaleString()}`,
                }}
                series={[
                  { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
                  { key: 'orders', name: 'Orders', color: '#10b981' },
                ]}
                interactive={{
                  tooltip: true,
                  zoom: true,
                  brush: true,
                  legend: true,
                  export: true,
                }}
                ai={{
                  insights: true,
                  trends: true,
                }}
                export={{
                  csv: true,
                  json: true,
                }}
                height={400}
              />
            </div>

            <CodeExample
              title="Implementation"
              code={`import { DataChart } from '@/components/data-visualization/charts/DataChart';

<DataChart
  type="line"
  data={timeSeriesData}
  title="Revenue Trends"
  xAxis={{
    key: 'date',
    label: 'Date',
    type: 'category',
  }}
  yAxis={{
    key: 'revenue',
    label: 'Revenue ($)',
    format: (v) => \`$\${v.toLocaleString()}\`,
  }}
  series={[
    { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
    { key: 'orders', name: 'Orders', color: '#10b981' },
  ]}
  interactive={{
    tooltip: true,
    zoom: true,
    brush: true,
    export: true,
  }}
  ai={{
    insights: true,
    trends: true,
  }}
/>`}
            />

            {/* Bar Chart Example */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Bar Chart with Stacking
              </h3>
              <DataChart
                type="bar"
                data={timeSeriesData.slice(0, 7)}
                title="Weekly Performance"
                xAxis={{ key: 'date', label: 'Date' }}
                yAxis={{ key: 'value', label: 'Value' }}
                series={[
                  { key: 'revenue', name: 'Revenue', color: '#3b82f6', stack: 'group1' },
                  { key: 'users', name: 'Users', color: '#f59e0b', stack: 'group1' },
                ]}
                height={350}
              />
            </div>

            {/* Pie Chart Example */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Pie Chart
              </h3>
              <DataChart
                type="pie"
                data={[
                  { name: 'Product A', value: 400 },
                  { name: 'Product B', value: 300 },
                  { name: 'Product C', value: 200 },
                  { name: 'Product D', value: 100 },
                ]}
                title="Product Distribution"
                series={[{ key: 'value', name: 'Sales' }]}
                height={350}
              />
            </div>
          </section>
        </div>
      )}

      {/* Tables Examples */}
      {activeTab === 'tables' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              VirtualTable Component
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              High-performance virtual scrolling table capable of handling 100,000+ rows smoothly.
            </p>

            {/* Virtual Table Example */}
            <div className="mb-8 h-[600px]">
              <VirtualTable
                data={tableData}
                columns={[
                  { id: 'id', header: 'ID', accessor: 'id', width: 60 },
                  { id: 'name', header: 'Name', accessor: 'name', sortable: true },
                  { id: 'email', header: 'Email', accessor: 'email', sortable: true },
                  { id: 'category', header: 'Category', accessor: 'category', filterable: true },
                  { id: 'status', header: 'Status', accessor: 'status', filterable: true },
                  {
                    id: 'revenue',
                    header: 'Revenue',
                    accessor: 'revenue',
                    sortable: true,
                    format: (v) => `$${v.toLocaleString()}`,
                  },
                  { id: 'score', header: 'Score', accessor: 'score', sortable: true },
                  { id: 'lastActivity', header: 'Last Activity', accessor: 'lastActivity' },
                ]}
                features={{
                  virtualScroll: true,
                  multiSort: true,
                  globalSearch: true,
                  rowSelection: 'multiple',
                  export: true,
                  columnVisibility: true,
                }}
                striped
                hover
              />
            </div>

            <CodeExample
              title="Implementation"
              code={`import { VirtualTable } from '@/components/data-visualization/tables/VirtualTable';

<VirtualTable
  data={tableData}
  columns={[
    { id: 'id', header: 'ID', accessor: 'id', width: 60 },
    { id: 'name', header: 'Name', accessor: 'name', sortable: true },
    { id: 'email', header: 'Email', accessor: 'email', sortable: true },
    {
      id: 'revenue',
      header: 'Revenue',
      accessor: 'revenue',
      sortable: true,
      format: (v) => \`$\${v.toLocaleString()}\`,
    },
  ]}
  features={{
    virtualScroll: true,
    multiSort: true,
    globalSearch: true,
    rowSelection: 'multiple',
    export: true,
  }}
  onRowClick={(row) => console.log('Row clicked:', row)}
  onSelectionChange={(selected) => console.log('Selected:', selected)}
/>`}
            />
          </section>
        </div>
      )}

      {/* Dashboard Examples */}
      {activeTab === 'dashboard' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Real-time Dashboard
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Live metrics dashboard with WebSocket integration for real-time updates.
            </p>

            <RealtimeMetrics
              metrics={[
                {
                  id: 'revenue',
                  title: 'Revenue',
                  websocketChannel: 'metrics.revenue',
                  sparkline: true,
                  size: 'lg',
                  fetchData: async () => ({
                    value: 125432,
                    change: 12.5,
                    changeType: 'increase',
                    trend: generateTimeSeriesData(20).map(d => ({ time: Date.now(), value: d.revenue })),
                    status: 'success',
                    unit: '',
                    prefix: '$',
                  }),
                },
                {
                  id: 'users',
                  title: 'Active Users',
                  websocketChannel: 'metrics.users',
                  sparkline: true,
                  fetchData: async () => ({
                    value: 3421,
                    change: 5.2,
                    changeType: 'increase',
                    trend: generateTimeSeriesData(20).map(d => ({ time: Date.now(), value: d.users })),
                    status: 'info',
                  }),
                },
                {
                  id: 'performance',
                  title: 'Performance',
                  websocketChannel: 'metrics.performance',
                  sparkline: true,
                  fetchData: async () => ({
                    value: 98.5,
                    change: -0.3,
                    changeType: 'decrease',
                    trend: generateTimeSeriesData(20).map(d => ({ time: Date.now(), value: d.conversion * 20 })),
                    status: 'warning',
                    suffix: '%',
                  }),
                },
                {
                  id: 'errors',
                  title: 'Error Rate',
                  websocketChannel: 'metrics.errors',
                  fetchData: async () => ({
                    value: 0.12,
                    change: -23.5,
                    changeType: 'decrease',
                    status: 'success',
                    suffix: '%',
                  }),
                },
              ]}
              layout="grid"
              columns={{ sm: 1, md: 2, lg: 4, xl: 4 }}
              autoRefresh
              refreshInterval={5000}
              showConnectionStatus
            />

            <CodeExample
              title="Implementation"
              code={`import { RealtimeMetrics } from '@/components/data-visualization/dashboard/RealtimeMetrics';

<RealtimeMetrics
  metrics={[
    {
      id: 'revenue',
      title: 'Revenue',
      websocketChannel: 'metrics.revenue',
      sparkline: true,
      size: 'lg',
      fetchData: async () => ({
        value: 125432,
        change: 12.5,
        changeType: 'increase',
        trend: revenueData,
        status: 'success',
        prefix: '$',
      }),
    },
    // ... more metrics
  ]}
  layout="grid"
  columns={{ sm: 1, md: 2, lg: 4 }}
  autoRefresh
  refreshInterval={5000}
  showConnectionStatus
/>`}
            />
          </section>
        </div>
      )}

      {/* AI Examples */}
      {activeTab === 'ai' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              AI Integration Components
            </h2>

            {/* AI Chat Interface */}
            <div className="mb-12">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                AI Chat Interface
              </h3>
              <div className="h-[600px]">
                <AIChatInterface
                  model="claude-3-sonnet"
                  features={{
                    voice: true,
                    attachments: true,
                    markdown: true,
                    suggestions: true,
                    feedback: true,
                    streaming: true,
                    commands: true,
                  }}
                  placeholder="Ask me anything..."
                  welcomeMessage="Hello! I'm your AI assistant. How can I help you today?"
                />
              </div>
            </div>

            {/* Voice AI Control */}
            <div className="mb-12">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Voice AI Control
              </h3>
              <div className="flex gap-8">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Default Variant</p>
                  <VoiceAIControl
                    features={{
                      waveform: true,
                      transcription: true,
                      commands: true,
                      voiceSynthesis: true,
                      realtime: true,
                    }}
                    commands={[
                      {
                        pattern: /open (.*)/i,
                        action: (params) => console.log('Opening:', params),
                        description: 'Open something',
                      },
                      {
                        pattern: /search for (.*)/i,
                        action: (params) => console.log('Searching:', params),
                        description: 'Search for something',
                      },
                    ]}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Minimal Variant</p>
                  <VoiceAIControl variant="minimal" size="lg" />
                </div>
              </div>
            </div>

            <CodeExample
              title="AI Chat Implementation"
              code={`import { AIChatInterface } from '@/components/ai/chat/AIChatInterface';

<AIChatInterface
  model="claude-3-sonnet"
  features={{
    voice: true,
    attachments: true,
    markdown: true,
    suggestions: true,
    feedback: true,
    streaming: true,
    commands: true,
  }}
  onSendMessage={async (message, attachments) => {
    // Process message with AI
    const response = await callAIAPI(message);
    return response;
  }}
  onReceiveMessage={(message) => {
    console.log('Received:', message);
  }}
/>`}
            />

            <CodeExample
              title="Voice Control Implementation"
              code={`import { VoiceAIControl } from '@/components/ai/voice/VoiceAIControl';

<VoiceAIControl
  features={{
    waveform: true,
    transcription: true,
    commands: true,
    voiceSynthesis: true,
    realtime: true,
  }}
  commands={[
    {
      pattern: /open (.*)/i,
      action: (params) => openFile(params[1]),
      description: 'Open a file',
    },
    {
      pattern: /search for (.*)/i,
      action: (params) => search(params[1]),
      description: 'Search for content',
    },
  ]}
  onTranscription={(text, confidence) => {
    console.log(\`Transcribed: \${text} (confidence: \${confidence})\`);
  }}
/>`}
            />
          </section>
        </div>
      )}

      {/* Reports Examples */}
      {activeTab === 'reports' && (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              Report Generator
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI-powered report generation with templates, visualizations, and export capabilities.
            </p>

            <div className="h-[700px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <ReportGenerator
                data={timeSeriesData}
                title="Monthly Business Report"
                subtitle="Performance Analysis and Insights"
                author="John Doe"
                company="BollaLabz Inc."
                features={{
                  ai: true,
                  preview: true,
                  export: true,
                  templates: true,
                  customization: true,
                }}
              />
            </div>

            <CodeExample
              title="Report Generator Implementation"
              code={`import { ReportGenerator } from '@/components/reports/ReportGenerator';

<ReportGenerator
  data={reportData}
  title="Monthly Business Report"
  subtitle="Performance Analysis and Insights"
  author="John Doe"
  company="BollaLabz Inc."
  features={{
    ai: true,
    preview: true,
    export: true,
    templates: true,
    customization: true,
  }}
  onGenerate={(report) => {
    console.log('Generated report:', report);
  }}
  onExport={(format, data) => {
    console.log(\`Exporting as \${format}\`);
  }}
/>`}
            />
          </section>
        </div>
      )}
    </div>
  );
};

export default DataVisualizationExamples;