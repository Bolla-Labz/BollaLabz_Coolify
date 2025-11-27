// Last Modified: 2025-11-23 17:30
// Mock People Analytics Data Generator

import type {
  PersonExtended,
  InteractionAnalytic,
  RelationshipInsight,
  SocialMediaActivity,
} from '../../types/people-analytics';

// Generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock People Data
export function generateMockPeople(): PersonExtended[] {
  const mockPeople = [
    {
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
      company: 'TechCorp Solutions',
      jobTitle: 'Senior Product Manager',
      industry: 'Technology',
      locationCity: 'San Francisco',
      locationState: 'CA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      twitterUrl: 'https://twitter.com/sarahjohnson',
      profileImageUrl: 'https://i.pravatar.cc/150?img=1',
      bio: 'Product leader passionate about building user-centric solutions.',
      interests: ['Product Management', 'UX Design', 'Agile'],
      tags: ['Client', 'VIP', 'Tech'],
      relationshipScore: 85,
      contactFrequency: 'weekly' as const,
      totalInteractions: 47,
    },
    {
      fullName: 'Michael Chen',
      email: 'michael.chen@innovate.io',
      phone: '+1 (555) 234-5678',
      company: 'Innovate Labs',
      jobTitle: 'CTO',
      industry: 'Software',
      locationCity: 'New York',
      locationState: 'NY',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      websiteUrl: 'https://michaelchen.dev',
      profileImageUrl: 'https://i.pravatar.cc/150?img=12',
      bio: 'Building the future of AI-powered applications.',
      interests: ['AI', 'Machine Learning', 'Cloud Architecture'],
      tags: ['Partner', 'Tech Lead'],
      relationshipScore: 92,
      contactFrequency: 'daily' as const,
      totalInteractions: 128,
    },
    {
      fullName: 'Emily Rodriguez',
      email: 'emily.r@designstudio.com',
      phone: '+1 (555) 345-6789',
      company: 'Creative Design Studio',
      jobTitle: 'Lead Designer',
      industry: 'Design',
      locationCity: 'Los Angeles',
      locationState: 'CA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
      instagramUrl: 'https://instagram.com/emilydesigns',
      profileImageUrl: 'https://i.pravatar.cc/150?img=5',
      bio: 'Award-winning designer specializing in brand identity.',
      interests: ['Design', 'Branding', 'Typography'],
      tags: ['Collaborator', 'Creative'],
      relationshipScore: 78,
      contactFrequency: 'weekly' as const,
      totalInteractions: 35,
    },
    {
      fullName: 'David Kim',
      email: 'david.kim@ventures.com',
      phone: '+1 (555) 456-7890',
      company: 'Summit Ventures',
      jobTitle: 'Investment Partner',
      industry: 'Venture Capital',
      locationCity: 'Boston',
      locationState: 'MA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/davidkim',
      profileImageUrl: 'https://i.pravatar.cc/150?img=15',
      bio: 'Early-stage investor focused on B2B SaaS companies.',
      interests: ['Investing', 'Startups', 'SaaS'],
      tags: ['Investor', 'Mentor'],
      relationshipScore: 88,
      contactFrequency: 'monthly' as const,
      totalInteractions: 24,
    },
    {
      fullName: 'Jessica Taylor',
      email: 'jtaylor@marketingpro.com',
      phone: '+1 (555) 567-8901',
      company: 'Marketing Pro Agency',
      jobTitle: 'Marketing Director',
      industry: 'Marketing',
      locationCity: 'Chicago',
      locationState: 'IL',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/jessicataylor',
      twitterUrl: 'https://twitter.com/jtaylormarketing',
      profileImageUrl: 'https://i.pravatar.cc/150?img=9',
      bio: 'Growth marketing expert helping B2B companies scale.',
      interests: ['Digital Marketing', 'Growth Hacking', 'Analytics'],
      tags: ['Client', 'Marketing'],
      relationshipScore: 72,
      contactFrequency: 'weekly' as const,
      totalInteractions: 42,
    },
    {
      fullName: 'Robert Martinez',
      email: 'rob.martinez@consulting.com',
      phone: '+1 (555) 678-9012',
      company: 'Strategic Consulting Group',
      jobTitle: 'Senior Consultant',
      industry: 'Consulting',
      locationCity: 'Seattle',
      locationState: 'WA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/robertmartinez',
      profileImageUrl: 'https://i.pravatar.cc/150?img=13',
      bio: 'Strategy consultant specializing in digital transformation.',
      interests: ['Strategy', 'Digital Transformation', 'Change Management'],
      tags: ['Advisor', 'Consultant'],
      relationshipScore: 65,
      contactFrequency: 'monthly' as const,
      totalInteractions: 18,
    },
    {
      fullName: 'Amanda Wong',
      email: 'amanda@dataanalytics.io',
      phone: '+1 (555) 789-0123',
      company: 'Data Analytics Inc',
      jobTitle: 'Data Science Lead',
      industry: 'Analytics',
      locationCity: 'Austin',
      locationState: 'TX',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/amandawong',
      websiteUrl: 'https://amandawong.com',
      profileImageUrl: 'https://i.pravatar.cc/150?img=10',
      bio: 'Data scientist passionate about extracting insights from data.',
      interests: ['Data Science', 'Python', 'Statistics'],
      tags: ['Tech', 'Analytics'],
      relationshipScore: 80,
      contactFrequency: 'weekly' as const,
      totalInteractions: 31,
    },
    {
      fullName: 'Christopher Lee',
      email: 'chris.lee@fintech.com',
      phone: '+1 (555) 890-1234',
      company: 'FinTech Innovations',
      jobTitle: 'VP of Engineering',
      industry: 'Financial Technology',
      locationCity: 'San Francisco',
      locationState: 'CA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/christopherlee',
      twitterUrl: 'https://twitter.com/chrislee',
      profileImageUrl: 'https://i.pravatar.cc/150?img=14',
      bio: 'Engineering leader building scalable financial platforms.',
      interests: ['FinTech', 'Engineering', 'Blockchain'],
      tags: ['Partner', 'Engineering'],
      relationshipScore: 75,
      contactFrequency: 'monthly' as const,
      totalInteractions: 22,
    },
    {
      fullName: 'Lisa Anderson',
      email: 'lisa.anderson@hr-solutions.com',
      phone: '+1 (555) 901-2345',
      company: 'HR Solutions Group',
      jobTitle: 'HR Director',
      industry: 'Human Resources',
      locationCity: 'Denver',
      locationState: 'CO',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/lisaanderson',
      profileImageUrl: 'https://i.pravatar.cc/150?img=20',
      bio: 'HR professional focused on building great company cultures.',
      interests: ['HR', 'Talent Development', 'Culture'],
      tags: ['Client', 'HR'],
      relationshipScore: 68,
      contactFrequency: 'rarely' as const,
      totalInteractions: 12,
    },
    {
      fullName: 'James Wilson',
      email: 'james@salesforce.com',
      phone: '+1 (555) 012-3456',
      company: 'Salesforce',
      jobTitle: 'Enterprise Account Executive',
      industry: 'Software',
      locationCity: 'San Francisco',
      locationState: 'CA',
      locationCountry: 'USA',
      linkedinUrl: 'https://linkedin.com/in/jameswilson',
      profileImageUrl: 'https://i.pravatar.cc/150?img=11',
      bio: 'Enterprise sales professional helping companies transform.',
      interests: ['Sales', 'CRM', 'Business Development'],
      tags: ['Vendor', 'Sales'],
      relationshipScore: 70,
      contactFrequency: 'weekly' as const,
      totalInteractions: 28,
    },
  ];

  const now = new Date();
  return mockPeople.map((person, index) => ({
    id: generateId(),
    ...person,
    lastContactDate: randomDate(
      new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      now
    ),
    dataEnrichedAt: new Date(),
    enrichmentSource: 'firecrawl' as const,
    createdAt: new Date(now.getTime() - (365 - index * 30) * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  }));
}

// Mock Interactions
export function generateMockInteractions(people: PersonExtended[]): InteractionAnalytic[] {
  const interactions: InteractionAnalytic[] = [];
  const interactionTypes: ('call' | 'sms' | 'email' | 'meeting' | 'social')[] = [
    'call',
    'sms',
    'email',
    'meeting',
    'social',
  ];
  const sentiments: ('positive' | 'neutral' | 'negative')[] = ['positive', 'neutral', 'negative'];

  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  people.forEach((person) => {
    const numInteractions = person.totalInteractions;

    for (let i = 0; i < numInteractions; i++) {
      const interactionType =
        interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];

      interactions.push({
        id: generateId(),
        personId: person.id,
        interactionDate: randomDate(ninetyDaysAgo, now),
        interactionType,
        durationSeconds:
          interactionType === 'call' ? Math.floor(Math.random() * 3600) + 60 : undefined,
        sentiment,
        topics: ['Business', 'Collaboration', 'Project Updates'].slice(
          0,
          Math.floor(Math.random() * 3) + 1
        ),
        notes:
          sentiment === 'positive'
            ? 'Great conversation, made good progress.'
            : sentiment === 'negative'
            ? 'Some concerns raised, need follow-up.'
            : 'Routine check-in, nothing major.',
        createdAt: new Date(),
      });
    }
  });

  return interactions.sort((a, b) => b.interactionDate.getTime() - a.interactionDate.getTime());
}

// Mock Relationship Insights
export function generateMockInsights(people: PersonExtended[]): RelationshipInsight[] {
  const insights: RelationshipInsight[] = [];
  const insightTemplates = [
    {
      type: 'recommendation' as const,
      text: 'Consider scheduling a catch-up call. It\'s been a while since your last interaction.',
      confidence: 85,
    },
    {
      type: 'opportunity' as const,
      text: 'This contact has been very engaged lately. Good time to discuss potential collaboration.',
      confidence: 92,
    },
    {
      type: 'warning' as const,
      text: 'Communication frequency has decreased significantly. You may want to reach out.',
      confidence: 78,
    },
    {
      type: 'milestone' as const,
      text: 'You\'ve maintained consistent communication for 6 months. Great job!',
      confidence: 95,
    },
  ];

  people.forEach((person) => {
    // Generate 1-2 insights per person
    const numInsights = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numInsights; i++) {
      const template = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expires in 30 days

      insights.push({
        id: generateId(),
        personId: person.id,
        insightType: template.type,
        insightText: template.text.replace('This contact', person.fullName),
        confidenceScore: template.confidence,
        isDismissed: false,
        createdAt: new Date(),
        expiresAt,
      });
    }
  });

  return insights;
}

// Mock Social Media Activity
export function generateMockSocialActivity(people: PersonExtended[]): SocialMediaActivity[] {
  const activities: SocialMediaActivity[] = [];
  const platforms: ('linkedin' | 'twitter' | 'facebook' | 'instagram')[] = [
    'linkedin',
    'twitter',
    'facebook',
    'instagram',
  ];
  const activityTypes: ('post' | 'like' | 'comment' | 'share' | 'mention')[] = [
    'post',
    'like',
    'comment',
    'share',
    'mention',
  ];

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  people.forEach((person) => {
    // Generate 3-8 social activities per person
    const numActivities = Math.floor(Math.random() * 6) + 3;

    for (let i = 0; i < numActivities; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

      activities.push({
        id: generateId(),
        personId: person.id,
        platform,
        activityType,
        activityUrl: `https://${platform}.com/${person.fullName.toLowerCase().replace(' ', '')}/post/${generateId()}`,
        contentPreview:
          activityType === 'post'
            ? 'Excited to share our latest project updates!'
            : `${activityType} on your post`,
        activityDate: randomDate(thirtyDaysAgo, now),
        createdAt: new Date(),
      });
    }
  });

  return activities.sort((a, b) => b.activityDate.getTime() - a.activityDate.getTime());
}

// Generate all mock people analytics data
export function generateAllMockPeopleData() {
  const people = generateMockPeople();
  const interactions = generateMockInteractions(people);
  const insights = generateMockInsights(people);
  const socialActivity = generateMockSocialActivity(people);

  return {
    people,
    interactions,
    insights,
    socialActivity,
  };
}
