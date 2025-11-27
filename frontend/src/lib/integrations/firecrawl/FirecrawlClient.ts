// Last Modified: 2025-11-23 17:30
// Firecrawl Web Scraping Integration Client

import FirecrawlApp from '@mendable/firecrawl-js';
import type {
  LinkedInProfile,
  CompanyInfo,
  EnrichedPersonData,
  WebMention,
} from '../../../types/people-analytics';

export interface FirecrawlConfig {
  apiKey: string;
}

export class FirecrawlClient {
  private client: FirecrawlApp;
  private config: FirecrawlConfig;

  constructor(config: FirecrawlConfig) {
    this.config = config;
    this.client = new FirecrawlApp({ apiKey: config.apiKey });
  }

  /**
   * Scrape LinkedIn profile
   */
  async scrapeLinkedInProfile(url: string): Promise<LinkedInProfile | null> {
    try {
      const result = await this.client.scrape(url, {
        formats: ['markdown', 'html'],
      }) as any;

      if (!result.success) {
        console.error('Failed to scrape LinkedIn profile:', result);
        return null;
      }

      // Parse the scraped content
      const content = result.markdown || result.html || '';

      return this.parseLinkedInProfile(content, url);
    } catch (error) {
      console.error('Error scraping LinkedIn profile:', error);
      return null;
    }
  }

  /**
   * Parse LinkedIn profile from scraped content
   */
  private parseLinkedInProfile(content: string, url: string): LinkedInProfile {
    // This is a simplified parser - in production, you'd use more sophisticated parsing
    const nameMatch = content.match(/(?:^|\n)#\s*(.+?)(?:\n|$)/);
    const headlineMatch = content.match(/(?:Headline|Title):\s*(.+?)(?:\n|$)/i);
    const aboutMatch = content.match(/(?:About|Summary):\s*(.+?)(?:\n|$)/i);
    const companyMatch = content.match(/(?:Company|Organization):\s*(.+?)(?:\n|$)/i);
    const locationMatch = content.match(/(?:Location):\s*(.+?)(?:\n|$)/i);

    return {
      name: nameMatch?.[1]?.trim() || 'Unknown',
      headline: headlineMatch?.[1]?.trim(),
      company: companyMatch?.[1]?.trim(),
      jobTitle: headlineMatch?.[1]?.trim(),
      location: locationMatch?.[1]?.trim(),
      about: aboutMatch?.[1]?.trim(),
      profileUrl: url,
    };
  }

  /**
   * Scrape company website for information
   */
  async scrapeCompanyInfo(domain: string): Promise<CompanyInfo | null> {
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;

      const result = await this.client.scrape(url, {
        formats: ['markdown', 'html'],
      }) as any;

      if (!result.success) {
        console.error('Failed to scrape company info:', result);
        return null;
      }

      const content = result.markdown || result.html || '';

      return this.parseCompanyInfo(content, domain);
    } catch (error) {
      console.error('Error scraping company info:', error);
      return null;
    }
  }

  /**
   * Parse company information from scraped content
   */
  private parseCompanyInfo(content: string, domain: string): CompanyInfo {
    // Simplified parsing - production would be more sophisticated
    const nameMatch = content.match(/(?:^|\n)#\s*(.+?)(?:\n|$)/);
    const descMatch = content.match(/(?:About|Description):\s*(.+?)(?:\n|$)/i);

    return {
      name: nameMatch?.[1]?.trim() || domain,
      domain,
      description: descMatch?.[1]?.trim(),
      website: `https://${domain}`,
    };
  }

  /**
   * Enrich person data using multiple sources
   */
  async enrichPersonData(
    name: string,
    company?: string,
    email?: string
  ): Promise<EnrichedPersonData | null> {
    try {
      // Search for the person online
      const searchQuery = `${name}${company ? ` ${company}` : ''}${email ? ` ${email}` : ''}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      const result = await this.client.scrape(searchUrl, {
        formats: ['markdown'],
      }) as any;

      if (!result.success) {
        console.error('Failed to enrich person data:', result);
        return null;
      }

      // Parse search results to find relevant links
      const content = result.markdown || '';
      const linkedinUrls = this.extractLinkedInUrls(content);

      let linkedinProfile: LinkedInProfile | null = null;
      if (linkedinUrls.length > 0) {
        linkedinProfile = await this.scrapeLinkedInProfile(linkedinUrls[0]);
      }

      let companyInfo: CompanyInfo | null = null;
      if (company) {
        const companyDomain = this.guessCompanyDomain(company);
        if (companyDomain) {
          companyInfo = await this.scrapeCompanyInfo(companyDomain);
        }
      }

      return {
        name,
        email,
        company: companyInfo || undefined,
        linkedinProfile: linkedinProfile || undefined,
      };
    } catch (error) {
      console.error('Error enriching person data:', error);
      return null;
    }
  }

  /**
   * Monitor web mentions of a person
   */
  async monitorPersonMentions(personName: string, company?: string): Promise<WebMention[]> {
    try {
      const searchQuery = `"${personName}"${company ? ` "${company}"` : ''}`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=nws`;

      const result = await this.client.scrape(searchUrl, {
        formats: ['markdown'],
      }) as any;

      if (!result.success) {
        return [];
      }

      const content = result.markdown || '';
      return this.parseWebMentions(content);
    } catch (error) {
      console.error('Error monitoring person mentions:', error);
      return [];
    }
  }

  /**
   * Crawl multiple pages from a website
   */
  async crawlWebsite(url: string, maxPages: number = 10): Promise<any[]> {
    try {
      // Note: crawlUrl has been removed from the Firecrawl API
      // Falling back to single page scrape for now
      const result = await this.client.scrape(url, {
        formats: ['markdown', 'html'],
      }) as any;

      if (!result.success) {
        console.error('Failed to scrape website:', result);
        return [];
      }

      return [result.data] || [];
    } catch (error) {
      console.error('Error crawling website:', error);
      return [];
    }
  }

  /**
   * Extract LinkedIn URLs from content
   */
  private extractLinkedInUrls(content: string): string[] {
    const regex = /https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/g;
    const matches = content.match(regex);
    return matches ? Array.from(new Set(matches)) : [];
  }

  /**
   * Guess company domain from company name
   */
  private guessCompanyDomain(companyName: string): string | null {
    // Simple domain guessing - production would use a company database/API
    const cleaned = companyName.toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    // Common company domain patterns
    const commonDomains = [
      `${cleaned}.com`,
      `${cleaned}.io`,
      `${cleaned}.net`,
    ];

    return commonDomains[0]; // Return the first guess
  }

  /**
   * Parse web mentions from search results
   */
  private parseWebMentions(content: string): WebMention[] {
    const mentions: WebMention[] = [];

    // Parse markdown links and snippets
    const linkRegex = /\[(.+?)\]\((.+?)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [, title, url] = match;

      mentions.push({
        url,
        title,
        snippet: '', // Would extract snippet from surrounding text
        source: new URL(url).hostname,
      });
    }

    return mentions;
  }

  /**
   * Batch scrape multiple URLs
   */
  async batchScrape(urls: string[]): Promise<any[]> {
    try {
      const promises = urls.map(url =>
        this.client.scrape(url, { formats: ['markdown'] }) as any
      );

      const results = await Promise.allSettled(promises);

      return results
        .filter((result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value);
    } catch (error) {
      console.error('Error batch scraping:', error);
      return [];
    }
  }
}

// Singleton instance
let firecrawlClientInstance: FirecrawlClient | null = null;

export function initFirecrawlClient(config: FirecrawlConfig): FirecrawlClient {
  firecrawlClientInstance = new FirecrawlClient(config);
  return firecrawlClientInstance;
}

export function getFirecrawlClient(): FirecrawlClient {
  if (!firecrawlClientInstance) {
    firecrawlClientInstance = new FirecrawlClient({
      apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY || '',
    });
  }
  return firecrawlClientInstance;
}
