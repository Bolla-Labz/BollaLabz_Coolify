// 08 December 2025 06 00 00

/**
 * Database Seed Script - BollaLabz Command Center
 *
 * Seeds the database with realistic sample data for development and testing.
 *
 * Features:
 * - 15-20 sample contacts with varied professional profiles
 * - 25-30 tasks linked to contacts with various statuses and priorities
 * - 10-15 phone records with transcriptions and summaries
 * - 5-10 calendar events
 * - Optional table clearing before seeding
 *
 * Usage:
 *   pnpm db:seed           # Seed with existing data
 *   pnpm db:seed --clear   # Clear tables then seed
 */

import { db } from "./index";
import {
  contacts,
  tasks,
  phoneRecords,
  calendarEvents,
  type NewContact,
  type NewTask,
  type NewPhoneRecord,
  type NewCalendarEvent,
} from "./schema";
import { sql } from "drizzle-orm";

// ============================================================================
// SAMPLE DATA GENERATORS
// ============================================================================

const SAMPLE_USER_ID = "00000000-0000-0000-0000-000000000001"; // Placeholder user ID

/**
 * Generate sample contacts with realistic business data
 */
function generateContacts(): NewContact[] {
  const contactsData: Array<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string;
    notes: string;
    tags: string[];
    relationshipScore: "cold" | "warm" | "hot" | "neutral" | "vip";
  }> = [
    {
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@techcorp.com",
      phone: "+1-415-555-0101",
      company: "TechCorp Industries",
      jobTitle: "Chief Technology Officer",
      notes: "Met at AWS re:Invent 2025. Interested in AI solutions for enterprise data management.",
      tags: ["enterprise", "ai", "decision-maker"],
      relationshipScore: "hot",
    },
    {
      firstName: "Michael",
      lastName: "Rodriguez",
      email: "m.rodriguez@innovate.io",
      phone: "+1-512-555-0202",
      company: "Innovate Labs",
      jobTitle: "VP of Engineering",
      notes: "Looking for scalable backend solutions. Budget approved for Q1 2026.",
      tags: ["engineering", "saas", "budget-approved"],
      relationshipScore: "vip",
    },
    {
      firstName: "Jessica",
      lastName: "Thompson",
      email: "jthompson@financialgroup.com",
      phone: "+1-212-555-0303",
      company: "Financial Group LLC",
      jobTitle: "Director of IT Operations",
      notes: "Requires SOC 2 compliance. Security audit scheduled for January.",
      tags: ["finance", "compliance", "security"],
      relationshipScore: "warm",
    },
    {
      firstName: "David",
      lastName: "Kim",
      email: "david.k@startupxyz.com",
      phone: "+1-650-555-0404",
      company: "StartupXYZ",
      jobTitle: "Founder & CEO",
      notes: "Early stage startup, just raised Series A. Moving fast, needs MVP by March.",
      tags: ["startup", "founder", "urgent"],
      relationshipScore: "hot",
    },
    {
      firstName: "Emily",
      lastName: "Watson",
      email: "ewatson@globalretail.com",
      phone: "+1-404-555-0505",
      company: "Global Retail Solutions",
      jobTitle: "Digital Transformation Lead",
      notes: "Managing e-commerce platform upgrade. Long sales cycle but high value.",
      tags: ["retail", "ecommerce", "enterprise"],
      relationshipScore: "warm",
    },
    {
      firstName: "James",
      lastName: "Patterson",
      email: "j.patterson@healthtech.io",
      phone: "+1-617-555-0606",
      company: "HealthTech Innovations",
      jobTitle: "Product Manager",
      notes: "HIPAA compliance required. Interested in real-time data sync capabilities.",
      tags: ["healthcare", "hipaa", "product"],
      relationshipScore: "warm",
    },
    {
      firstName: "Amanda",
      lastName: "Foster",
      email: "afoster@eduplatform.edu",
      phone: "+1-510-555-0707",
      company: "EduPlatform",
      jobTitle: "Head of Technology",
      notes: "Educational sector, budget constraints but committed to modernization.",
      tags: ["education", "nonprofit", "modernization"],
      relationshipScore: "neutral",
    },
    {
      firstName: "Robert",
      lastName: "Zhang",
      email: "robert@cloudservices.net",
      phone: "+1-206-555-0808",
      company: "Cloud Services Inc",
      jobTitle: "Solutions Architect",
      notes: "Technical champion, can influence purchasing decisions. Very responsive.",
      tags: ["cloud", "technical", "champion"],
      relationshipScore: "hot",
    },
    {
      firstName: "Lisa",
      lastName: "Anderson",
      email: "landerson@manufacturingco.com",
      phone: "+1-313-555-0909",
      company: "Manufacturing Co",
      jobTitle: "Operations Manager",
      notes: "Legacy systems, hesitant about cloud migration. Needs education.",
      tags: ["manufacturing", "legacy", "needs-nurturing"],
      relationshipScore: "cold",
    },
    {
      firstName: "Christopher",
      lastName: "Martinez",
      email: "cmartinez@consultingfirm.com",
      phone: "+1-312-555-1010",
      company: "Elite Consulting Firm",
      jobTitle: "Partner",
      notes: "Could refer multiple clients. Networking relationship, high priority.",
      tags: ["consulting", "referral-source", "vip"],
      relationshipScore: "vip",
    },
    {
      firstName: "Jennifer",
      lastName: "Lee",
      email: "jlee@mediagroup.tv",
      phone: "+1-323-555-1111",
      company: "Media Group",
      jobTitle: "Chief Digital Officer",
      notes: "Fast-paced environment, needs real-time analytics. Video streaming focus.",
      tags: ["media", "streaming", "analytics"],
      relationshipScore: "warm",
    },
    {
      firstName: "Daniel",
      lastName: "Brown",
      email: "dbrown@logistics.com",
      phone: "+1-901-555-1212",
      company: "Logistics Solutions",
      jobTitle: "IT Director",
      notes: "Fleet management and tracking needs. Integration with existing ERP.",
      tags: ["logistics", "integration", "erp"],
      relationshipScore: "neutral",
    },
    {
      firstName: "Michelle",
      lastName: "Taylor",
      email: "mtaylor@insurancegroup.com",
      phone: "+1-860-555-1313",
      company: "Insurance Group",
      jobTitle: "VP of Digital Strategy",
      notes: "Evaluating vendors, decision timeline Q2 2026. Multiple stakeholders.",
      tags: ["insurance", "evaluation", "long-cycle"],
      relationshipScore: "warm",
    },
    {
      firstName: "Kevin",
      lastName: "Wilson",
      email: "kwilson@realestate.net",
      phone: "+1-305-555-1414",
      company: "Real Estate Ventures",
      jobTitle: "Technology Manager",
      notes: "Property management platform modernization. Mobile-first requirement.",
      tags: ["real-estate", "mobile", "platform"],
      relationshipScore: "neutral",
    },
    {
      firstName: "Rachel",
      lastName: "Garcia",
      email: "rgarcia@energyco.com",
      phone: "+1-713-555-1515",
      company: "Energy Corporation",
      jobTitle: "Innovation Director",
      notes: "Exploring IoT solutions for smart grid. Long procurement process.",
      tags: ["energy", "iot", "enterprise"],
      relationshipScore: "cold",
    },
    {
      firstName: "Thomas",
      lastName: "Moore",
      email: "tmoore@traveltech.com",
      phone: "+1-702-555-1616",
      company: "TravelTech Platform",
      jobTitle: "Engineering Manager",
      notes: "High-traffic booking system, performance critical. Open source advocate.",
      tags: ["travel", "performance", "opensource"],
      relationshipScore: "hot",
    },
    {
      firstName: "Angela",
      lastName: "White",
      email: "awhite@fashionbrand.com",
      phone: "+1-646-555-1717",
      company: "Fashion Brand Inc",
      jobTitle: "Digital Commerce Director",
      notes: "Seasonal spikes, needs elastic infrastructure. Focus on customer experience.",
      tags: ["fashion", "ecommerce", "seasonal"],
      relationshipScore: "warm",
    },
    {
      firstName: "Steven",
      lastName: "Harris",
      email: "sharris@biotech.org",
      phone: "+1-858-555-1818",
      company: "BioTech Research",
      jobTitle: "Data Science Lead",
      notes: "Research data management, compliance heavy. Grant-funded projects.",
      tags: ["biotech", "research", "compliance"],
      relationshipScore: "neutral",
    },
  ];

  return contactsData.map((contact) => ({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    company: contact.company,
    jobTitle: contact.jobTitle,
    notes: contact.notes,
    tags: contact.tags,
    relationshipScore: contact.relationshipScore,
    lastContactedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
  }));
}

/**
 * Generate tasks linked to contacts
 */
function generateTasks(contactIds: string[]): NewTask[] {
  const taskTemplates = [
    {
      title: "Send proposal for cloud migration project",
      description: "Prepare detailed technical proposal with pricing breakdown and implementation timeline.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["sales", "proposal", "urgent"],
      daysFromNow: 3,
    },
    {
      title: "Schedule demo for new analytics dashboard",
      description: "Coordinate 45-minute product demo showcasing real-time analytics capabilities.",
      status: "in_progress" as const,
      priority: "high" as const,
      tags: ["demo", "product", "sales"],
      daysFromNow: 2,
    },
    {
      title: "Follow up on security compliance questions",
      description: "Address SOC 2 and GDPR compliance questions raised during last call.",
      status: "todo" as const,
      priority: "medium" as const,
      tags: ["compliance", "follow-up"],
      daysFromNow: 1,
    },
    {
      title: "Review technical requirements document",
      description: "Analyze requirements doc and identify any gaps or clarifications needed.",
      status: "in_progress" as const,
      priority: "medium" as const,
      tags: ["technical", "review"],
      daysFromNow: 5,
    },
    {
      title: "Prepare API integration guide",
      description: "Create step-by-step integration documentation for development team.",
      status: "todo" as const,
      priority: "low" as const,
      tags: ["documentation", "technical"],
      daysFromNow: 7,
    },
    {
      title: "Send contract for signature",
      description: "Final contract review completed, ready to send via DocuSign.",
      status: "done" as const,
      priority: "high" as const,
      tags: ["contract", "legal", "completed"],
      daysFromNow: -2,
    },
    {
      title: "Quarterly business review meeting",
      description: "Present Q4 metrics and discuss 2026 expansion opportunities.",
      status: "todo" as const,
      priority: "medium" as const,
      tags: ["meeting", "qbr", "strategy"],
      daysFromNow: 14,
    },
    {
      title: "Research competitor solutions",
      description: "Analyze competing products to prepare competitive positioning document.",
      status: "in_progress" as const,
      priority: "low" as const,
      tags: ["research", "competitive"],
      daysFromNow: 10,
    },
    {
      title: "Submit RFP response",
      description: "Complete and submit response to Request for Proposal by deadline.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["rfp", "sales", "deadline"],
      daysFromNow: 4,
    },
    {
      title: "Conduct technical discovery session",
      description: "Deep-dive session to understand current infrastructure and pain points.",
      status: "done" as const,
      priority: "medium" as const,
      tags: ["discovery", "technical", "completed"],
      daysFromNow: -5,
    },
    {
      title: "Create custom pricing quote",
      description: "Volume discount calculation and multi-year pricing options.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["pricing", "sales"],
      daysFromNow: 2,
    },
    {
      title: "Schedule executive alignment call",
      description: "Coordinate call between C-level stakeholders to discuss strategic partnership.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["executive", "partnership"],
      daysFromNow: 6,
    },
    {
      title: "Send case study references",
      description: "Share 3 relevant customer success stories in similar industry vertical.",
      status: "done" as const,
      priority: "low" as const,
      tags: ["case-study", "reference", "completed"],
      daysFromNow: -3,
    },
    {
      title: "Update CRM with meeting notes",
      description: "Document key discussion points and next steps from yesterday's call.",
      status: "done" as const,
      priority: "low" as const,
      tags: ["admin", "crm", "completed"],
      daysFromNow: -1,
    },
    {
      title: "Prepare ROI analysis",
      description: "Build financial model showing 3-year total cost of ownership and ROI projections.",
      status: "in_progress" as const,
      priority: "medium" as const,
      tags: ["finance", "roi", "analysis"],
      daysFromNow: 5,
    },
    {
      title: "Coordinate proof of concept",
      description: "Set up POC environment with real data sample for 30-day trial.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["poc", "technical"],
      daysFromNow: 7,
    },
    {
      title: "Address data migration concerns",
      description: "Prepare migration strategy and timeline for legacy system data.",
      status: "todo" as const,
      priority: "medium" as const,
      tags: ["migration", "technical"],
      daysFromNow: 8,
    },
    {
      title: "Send onboarding checklist",
      description: "Welcome email with implementation kickoff checklist and timeline.",
      status: "done" as const,
      priority: "medium" as const,
      tags: ["onboarding", "customer-success", "completed"],
      daysFromNow: -4,
    },
    {
      title: "Review MSA with legal team",
      description: "Legal review of Master Services Agreement amendments requested by customer.",
      status: "in_progress" as const,
      priority: "high" as const,
      tags: ["legal", "contract"],
      daysFromNow: 3,
    },
    {
      title: "Schedule product roadmap presentation",
      description: "Present 2026 product roadmap to demonstrate ongoing innovation.",
      status: "todo" as const,
      priority: "low" as const,
      tags: ["product", "roadmap"],
      daysFromNow: 15,
    },
    {
      title: "Send renewal proposal",
      description: "Annual renewal proposal with expansion options for additional users.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["renewal", "sales"],
      daysFromNow: 10,
    },
    {
      title: "Conduct customer satisfaction survey",
      description: "Send NPS survey and schedule follow-up for feedback discussion.",
      status: "todo" as const,
      priority: "low" as const,
      tags: ["customer-success", "feedback"],
      daysFromNow: 12,
    },
    {
      title: "Prepare integration specifications",
      description: "Document API endpoints and webhook configurations for third-party integrations.",
      status: "in_progress" as const,
      priority: "medium" as const,
      tags: ["technical", "integration"],
      daysFromNow: 6,
    },
    {
      title: "Send holiday greeting and check-in",
      description: "Personal outreach to maintain relationship during holiday season.",
      status: "done" as const,
      priority: "low" as const,
      tags: ["relationship", "personal", "completed"],
      daysFromNow: -7,
    },
    {
      title: "Review performance metrics dashboard",
      description: "Analyze usage metrics and prepare recommendations for optimization.",
      status: "todo" as const,
      priority: "medium" as const,
      tags: ["analytics", "optimization"],
      daysFromNow: 9,
    },
    {
      title: "Coordinate training session",
      description: "Schedule end-user training webinar for new features launch.",
      status: "todo" as const,
      priority: "medium" as const,
      tags: ["training", "customer-success"],
      daysFromNow: 11,
    },
    {
      title: "Submit budget approval request",
      description: "Internal approval for custom development hours requested by customer.",
      status: "in_progress" as const,
      priority: "high" as const,
      tags: ["internal", "budget"],
      daysFromNow: 2,
    },
    {
      title: "Prepare technical architecture diagram",
      description: "Visual representation of system architecture for stakeholder presentation.",
      status: "todo" as const,
      priority: "low" as const,
      tags: ["technical", "documentation"],
      daysFromNow: 13,
    },
    {
      title: "Send thank you note after demo",
      description: "Personal follow-up thanking attendees and offering to answer questions.",
      status: "done" as const,
      priority: "low" as const,
      tags: ["relationship", "follow-up", "completed"],
      daysFromNow: -1,
    },
    {
      title: "Review data privacy requirements",
      description: "Ensure compliance with GDPR, CCPA, and industry-specific regulations.",
      status: "todo" as const,
      priority: "high" as const,
      tags: ["compliance", "privacy", "legal"],
      daysFromNow: 4,
    },
  ];

  // Randomly assign tasks to contacts
  return taskTemplates.map((template) => {
    const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.daysFromNow);

    return {
      userId: SAMPLE_USER_ID,
      title: template.title,
      description: template.description,
      status: template.status,
      priority: template.priority,
      dueDate: template.status !== "done" ? dueDate : null,
      contactId,
      tags: template.tags,
      completedAt: template.status === "done" ? new Date(Date.now() + template.daysFromNow * 24 * 60 * 60 * 1000) : null,
    };
  });
}

/**
 * Generate phone records with realistic transcriptions
 */
function generatePhoneRecords(contactIds: string[]): NewPhoneRecord[] {
  const phoneRecordTemplates = [
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 1245, // 20:45
      transcription:
        "Hi Sarah, this is following up on our email thread about the enterprise AI solution. I wanted to walk through the technical architecture and answer your questions about scalability. [Discussion about distributed computing, load balancing, and auto-scaling capabilities] That makes sense - I'll send over the detailed technical specs and case studies from similar enterprise deployments. Let's schedule a deeper dive with your engineering team next week.",
      summary: "Technical discussion about enterprise AI solution architecture. Contact interested in scalability and distributed computing capabilities. Next step: Send technical specs and schedule engineering team call.",
      sentiment: "positive" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 892, // 14:52
      transcription:
        "Thanks for taking my call. I've been reviewing your proposal and have some questions about the pricing structure. [Discussion about volume discounts, multi-year commitments, and ROI calculations] The numbers look good, but I need to run this by our CFO before proceeding. Can you send me a one-pager I can share with the finance team?",
      summary: "Pricing discussion and ROI review. Contact needs approval from CFO. Action item: Create finance-focused one-pager for executive review.",
      sentiment: "positive" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 456, // 7:36
      transcription:
        "Just wanted to quickly check in on the security audit timeline. I know you mentioned January, and I wanted to make sure we're prepared with all the documentation you'll need. [Brief discussion about SOC 2 compliance documents] Perfect, I'll have those sent over by end of week.",
      summary: "Quick check-in regarding security audit preparation. Agreed to send SOC 2 compliance documentation by end of week.",
      sentiment: "neutral" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 1876, // 31:16
      transcription:
        "We had our internal stakeholder meeting and everyone is aligned on moving forward with the MVP timeline for March. [Detailed discussion about feature prioritization, development sprints, and milestone deliverables] The main concern is around the API integration with our existing CRM system. Can your team do a technical discovery session next week?",
      summary: "Internal alignment confirmed, project approved for March MVP delivery. Key concern: CRM integration compatibility. Schedule technical discovery session for next week.",
      sentiment: "positive" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 2134, // 35:34
      transcription:
        "Thanks for making time for this demo. I'm going to share my screen and walk through the analytics dashboard features. [Comprehensive demo of real-time data visualization, custom reporting, and alert configurations] As you can see, you can drill down into any metric and create custom views for different stakeholder groups. What specific use cases are most important for your team?",
      summary: "Product demo showcasing analytics dashboard and real-time reporting capabilities. Contact engaged and asking detailed questions about customization options.",
      sentiment: "positive" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 678, // 11:18
      transcription:
        "I received your proposal but I'm concerned about the migration timeline. Our current system has 10 years of historical data and we can't afford any downtime. [Discussion about phased migration strategy and zero-downtime deployment] That sounds more reasonable. Can you put together a detailed migration plan?",
      summary: "Concerns raised about data migration and system downtime. Discussed phased migration approach. Need to create detailed migration plan document.",
      sentiment: "mixed" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 334, // 5:34
      transcription:
        "Quick follow-up from our meeting yesterday. I'm sending over those case studies we discussed - three companies in the retail sector with similar scale to your operation. Let me know if you have any questions after reviewing them.",
      summary: "Follow-up call to confirm sending of retail industry case studies. Brief check-in to ensure contact has needed information.",
      sentiment: "neutral" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 1523, // 25:23
      transcription:
        "We're evaluating three vendors and need to make a decision by end of Q1. [Discussion about competitive differentiators, implementation timeline, and total cost of ownership] Your platform has the features we need, but the other vendors are offering more aggressive pricing. Is there any flexibility on your end?",
      summary: "Competitive evaluation in progress, decision timeline Q1 2026. Price sensitivity identified. Need to explore pricing flexibility and emphasize differentiation.",
      sentiment: "neutral" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 945, // 15:45
      transcription:
        "I wanted to personally reach out about the renewal coming up in March. I know you've had a great first year with the platform. [Discussion about usage metrics, ROI achieved, and expansion opportunities] I'd love to schedule a QBR to review the metrics and discuss adding those additional features you mentioned.",
      summary: "Annual renewal discussion showing strong ROI and platform adoption. Contact interested in expanding usage. Schedule QBR to discuss expansion.",
      sentiment: "positive" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 567, // 9:27
      transcription:
        "I need to escalate an issue we're experiencing with the API rate limits. During peak hours we're hitting throttling errors. [Technical discussion about current limits, usage patterns, and infrastructure scaling] Can we get on a call with your engineering team to optimize this?",
      summary: "Support escalation: API rate limiting issues during peak usage. Technical problem requiring engineering team involvement. Schedule engineering call.",
      sentiment: "negative" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 1789, // 29:49
      transcription:
        "Thanks for agreeing to this discovery session. I want to really understand your current workflow and pain points. [Detailed discussion about existing processes, bottlenecks, integration points, and team structure] This is super helpful. Based on what you've shared, I think we can solve 80% of these issues with our standard platform, and the remaining 20% might need some custom configuration.",
      summary: "Comprehensive discovery session documenting current workflow and pain points. Identified solution fit: 80% standard platform, 20% custom configuration needed.",
      sentiment: "positive" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 423, // 7:03
      transcription:
        "Just wanted to say thank you for the training session last week. The team found it really valuable and we're already seeing increased adoption. A few users had questions about the advanced reporting features - can we schedule a follow-up session?",
      summary: "Positive feedback on training session, increased user adoption noted. Request for follow-up training on advanced features.",
      sentiment: "positive" as const,
    },
    {
      direction: "outbound" as const,
      status: "no-answer" as const,
      duration: 0,
      transcription: null,
      summary: "Attempted to reach contact for scheduled call - no answer. Left voicemail requesting callback.",
      sentiment: "neutral" as const,
    },
    {
      direction: "inbound" as const,
      status: "completed" as const,
      duration: 1654, // 27:34
      transcription:
        "We're ready to move forward with the proof of concept. [Discussion about POC scope, success criteria, timeline, and resource allocation] I'll need access credentials for the test environment and documentation for our developers. When can we kick this off?",
      summary: "POC approved and ready to begin. Contact needs test environment access and developer documentation. Coordinate POC kickoff logistics.",
      sentiment: "positive" as const,
    },
    {
      direction: "outbound" as const,
      status: "completed" as const,
      duration: 712, // 11:52
      transcription:
        "Following up on the security questionnaire you sent over. I've coordinated with our compliance team and we have responses to all 47 questions. [Review of key security and compliance points] I'm sending the completed questionnaire along with our SOC 2 Type II report and penetration test results.",
      summary: "Security questionnaire completed with compliance team input. Providing comprehensive security documentation including SOC 2 and pen test results.",
      sentiment: "neutral" as const,
    },
  ];

  // Randomly assign phone records to contacts
  return phoneRecordTemplates.map((template, index) => {
    const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
    const phoneNumber = `+1-${Math.floor(Math.random() * 900 + 100)}-555-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const createdAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000); // Last 14 days

    return {
      userId: SAMPLE_USER_ID,
      contactId,
      phoneNumber,
      direction: template.direction,
      status: template.status,
      duration: template.duration,
      telnyxCallControlId: template.status === "completed" ? `v3:${crypto.randomUUID()}` : null,
      transcription: template.transcription,
      summary: template.summary,
      sentiment: template.sentiment,
      metadata: {
        callQuality: template.duration > 0 ? "excellent" : null,
        recordingAvailable: template.duration > 0,
      },
      createdAt,
    };
  });
}

/**
 * Generate calendar events
 */
function generateCalendarEvents(contactIds: string[]): NewCalendarEvent[] {
  const eventTemplates = [
    {
      title: "Product Demo - Analytics Dashboard",
      description: "Demonstrate real-time analytics capabilities and custom reporting features.",
      location: "Zoom Meeting",
      allDay: false,
      hoursFromNow: 24,
      durationHours: 1,
      reminderMinutes: 15,
      contactCount: 1,
    },
    {
      title: "Technical Discovery Session",
      description: "Deep-dive into current infrastructure, pain points, and integration requirements.",
      location: "Google Meet",
      allDay: false,
      hoursFromNow: 48,
      durationHours: 1.5,
      reminderMinutes: 30,
      contactCount: 2,
    },
    {
      title: "Quarterly Business Review",
      description: "Review Q4 2025 metrics, ROI analysis, and discuss 2026 expansion opportunities.",
      location: "Client Office - Conference Room A",
      allDay: false,
      hoursFromNow: 168, // 1 week
      durationHours: 2,
      reminderMinutes: 60,
      contactCount: 3,
    },
    {
      title: "Contract Signing Meeting",
      description: "Final contract review and signing ceremony. Legal teams from both sides attending.",
      location: "BollaLabz HQ",
      allDay: false,
      hoursFromNow: 72,
      durationHours: 1,
      reminderMinutes: 60,
      contactCount: 2,
    },
    {
      title: "Technical Training Webinar",
      description: "End-user training session covering platform basics and best practices.",
      location: "Microsoft Teams",
      allDay: false,
      hoursFromNow: 120,
      durationHours: 2,
      reminderMinutes: 30,
      contactCount: 1,
    },
    {
      title: "Executive Alignment Call",
      description: "C-level stakeholder meeting to discuss strategic partnership and long-term roadmap.",
      location: "Zoom Meeting",
      allDay: false,
      hoursFromNow: 240, // 10 days
      durationHours: 1,
      reminderMinutes: 120,
      contactCount: 2,
    },
    {
      title: "POC Kickoff Meeting",
      description: "Proof of concept initiation - review success criteria, timeline, and resource allocation.",
      location: "Google Meet",
      allDay: false,
      hoursFromNow: 96,
      durationHours: 1.5,
      reminderMinutes: 30,
      contactCount: 2,
    },
    {
      title: "Security & Compliance Review",
      description: "Address security questionnaire, audit requirements, and compliance documentation.",
      location: "Zoom Meeting",
      allDay: false,
      hoursFromNow: 144,
      durationHours: 1,
      reminderMinutes: 15,
      contactCount: 1,
    },
    {
      title: "Networking Event - AWS Summit",
      description: "Industry conference and networking opportunity. Multiple prospect meetings scheduled.",
      location: "Las Vegas Convention Center",
      allDay: true,
      hoursFromNow: 720, // 30 days
      durationHours: 8,
      reminderMinutes: 1440, // 1 day
      contactCount: 4,
    },
    {
      title: "Follow-up Call - Migration Planning",
      description: "Discuss detailed migration strategy for legacy system data and timeline coordination.",
      location: "Phone Call",
      allDay: false,
      hoursFromNow: 36,
      durationHours: 0.5,
      reminderMinutes: 15,
      contactCount: 1,
    },
  ];

  return eventTemplates.map((template) => {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + template.hoursFromNow);

    // Round to nearest 15 minutes
    if (!template.allDay) {
      startTime.setMinutes(Math.round(startTime.getMinutes() / 15) * 15);
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + template.durationHours);

    // Select random contacts for this event
    const selectedContactIds = Array.from(
      { length: template.contactCount },
      () => contactIds[Math.floor(Math.random() * contactIds.length)]
    );

    return {
      userId: SAMPLE_USER_ID,
      title: template.title,
      description: template.description,
      startTime,
      endTime,
      allDay: template.allDay,
      location: template.location,
      contactIds: selectedContactIds,
      reminderMinutes: template.reminderMinutes,
      externalSource: null,
    };
  });
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

/**
 * Clear all tables before seeding (optional)
 */
async function clearTables() {
  console.log("🗑️  Clearing existing data...");

  try {
    // Delete in order of dependencies (child tables first)
    await db.delete(calendarEvents).execute();
    await db.delete(phoneRecords).execute();
    await db.delete(tasks).execute();
    await db.delete(contacts).execute();

    console.log("✅ All tables cleared successfully");
  } catch (error) {
    console.error("❌ Error clearing tables:", error);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seed() {
  const startTime = Date.now();
  console.log("🌱 Seeding BollaLabz database...\n");

  try {
    // Check for --clear flag
    const shouldClear = process.argv.includes("--clear");
    if (shouldClear) {
      await clearTables();
      console.log();
    }

    // Step 1: Insert contacts
    console.log("👥 Inserting contacts...");
    const contactsData = generateContacts();
    const insertedContacts = await db.insert(contacts).values(contactsData).returning({ id: contacts.id });
    console.log(`   ✓ Inserted ${insertedContacts.length} contacts`);

    const contactIds = insertedContacts.map((c) => c.id);

    // Step 2: Insert tasks
    console.log("\n📋 Inserting tasks...");
    const tasksData = generateTasks(contactIds);
    const insertedTasks = await db.insert(tasks).values(tasksData).returning({ id: tasks.id });
    console.log(`   ✓ Inserted ${insertedTasks.length} tasks`);

    // Step 3: Insert phone records
    console.log("\n📞 Inserting phone records...");
    const phoneRecordsData = generatePhoneRecords(contactIds);
    const insertedPhoneRecords = await db.insert(phoneRecords).values(phoneRecordsData).returning({ id: phoneRecords.id });
    console.log(`   ✓ Inserted ${insertedPhoneRecords.length} phone records`);

    // Step 4: Insert calendar events
    console.log("\n📅 Inserting calendar events...");
    const calendarEventsData = generateCalendarEvents(contactIds);
    const insertedCalendarEvents = await db
      .insert(calendarEvents)
      .values(calendarEventsData)
      .returning({ id: calendarEvents.id });
    console.log(`   ✓ Inserted ${insertedCalendarEvents.length} calendar events`);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n" + "=".repeat(50));
    console.log("✅ Seeding completed successfully!");
    console.log("=".repeat(50));
    console.log(`📊 Summary:`);
    console.log(`   • Contacts:        ${insertedContacts.length}`);
    console.log(`   • Tasks:           ${insertedTasks.length}`);
    console.log(`   • Phone Records:   ${insertedPhoneRecords.length}`);
    console.log(`   • Calendar Events: ${insertedCalendarEvents.length}`);
    console.log(`   • Duration:        ${duration}s`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n❌ Seeding failed:");
    console.error(error);
    throw error;
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

seed()
  .then(() => {
    console.log("🎉 Database is ready for development!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error during seeding:", error);
    process.exit(1);
  });
