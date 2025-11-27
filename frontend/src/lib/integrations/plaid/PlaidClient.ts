// Last Modified: 2025-11-23 17:30
// Plaid Banking API Integration Client

import axios, { AxiosInstance } from 'axios';
import type {
  BankAccount,
  Transaction,
  PlaidLinkToken,
  PlaidAccessToken,
} from '../../../types/financial';

export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  apiUrl?: string;
}

export interface PlaidWebhook {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  new_transactions: number;
}

export class PlaidClient {
  private client: AxiosInstance;
  private config: PlaidConfig;

  constructor(config: PlaidConfig) {
    this.config = config;

    // Set API URL based on environment
    const baseURL = config.apiUrl || this.getBaseUrl(config.environment);

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });
  }

  private getBaseUrl(environment: string): string {
    const urls = {
      sandbox: 'https://sandbox.plaid.com',
      development: 'https://development.plaid.com',
      production: 'https://production.plaid.com',
    };
    return urls[environment as keyof typeof urls] || urls.sandbox;
  }

  private getAuthBody() {
    return {
      client_id: this.config.clientId,
      secret: this.config.secret,
    };
  }

  /**
   * Create Link Token for Plaid Link initialization
   */
  async createLinkToken(userId: string): Promise<PlaidLinkToken> {
    try {
      const response = await this.client.post('/link/token/create', {
        ...this.getAuthBody(),
        user: {
          client_user_id: userId,
        },
        client_name: 'BollaLabz',
        products: ['transactions', 'auth', 'balance'],
        country_codes: ['US'],
        language: 'en',
        webhook: `${import.meta.env.VITE_API_URL}/webhooks/plaid`,
      });

      return {
        linkToken: response.data.link_token,
        expiration: new Date(response.data.expiration),
      };
    } catch (error) {
      console.error('Error creating Plaid Link token:', error);
      throw new Error('Failed to create Plaid Link token');
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken: string): Promise<PlaidAccessToken> {
    try {
      const response = await this.client.post('/item/public_token/exchange', {
        ...this.getAuthBody(),
        public_token: publicToken,
      });

      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Get bank accounts for an access token
   */
  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    try {
      const response = await this.client.post('/accounts/get', {
        ...this.getAuthBody(),
        access_token: accessToken,
      });

      const accounts = response.data.accounts || [];
      const institution = response.data.item?.institution_id || 'Unknown';

      return accounts.map((account: any) => ({
        id: account.account_id,
        userId: '', // Will be set by the calling function
        institutionName: institution,
        accountType: this.mapAccountType(account.type),
        accountNumber: account.mask || '',
        currentBalance: account.balances.current || 0,
        availableBalance: account.balances.available || null,
        currency: account.balances.iso_currency_code || 'USD',
        plaidAccountId: account.account_id,
        plaidAccessToken: accessToken,
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch bank accounts');
    }
  }

  /**
   * Get transactions for a date range
   */
  async getTransactions(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      const response = await this.client.post('/transactions/get', {
        ...this.getAuthBody(),
        access_token: accessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        options: {
          count: 500, // Maximum transactions per request
          offset: 0,
        },
      });

      const transactions = response.data.transactions || [];

      return transactions.map((tx: any) => ({
        id: tx.transaction_id,
        accountId: tx.account_id,
        plaidTransactionId: tx.transaction_id,
        transactionDate: new Date(tx.date),
        postedDate: tx.authorized_date ? new Date(tx.authorized_date) : undefined,
        amount: tx.amount,
        category: tx.category?.[0] || 'Uncategorized',
        subcategory: tx.category?.[1] || undefined,
        merchantName: tx.merchant_name || tx.name,
        description: tx.name,
        transactionType: tx.amount > 0 ? 'debit' : 'credit',
        pending: tx.pending,
        locationCity: tx.location?.city || undefined,
        locationState: tx.location?.region || undefined,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Get current balance for accounts
   */
  async getBalance(accessToken: string): Promise<{ accountId: string; balance: number }[]> {
    try {
      const response = await this.client.post('/accounts/balance/get', {
        ...this.getAuthBody(),
        access_token: accessToken,
      });

      const accounts = response.data.accounts || [];

      return accounts.map((account: any) => ({
        accountId: account.account_id,
        balance: account.balances.current || 0,
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch account balance');
    }
  }

  /**
   * Sync transactions (called by webhook handler)
   */
  async syncTransactions(webhookData: PlaidWebhook): Promise<void> {
    // This will be implemented to handle webhook notifications
    // and sync new transactions automatically
    console.log('Syncing transactions from webhook:', webhookData);

    // TODO: Implement transaction sync logic
    // 1. Fetch new transactions using getTransactions()
    // 2. Store them in the database
    // 3. Update account balances
  }

  /**
   * Remove item (disconnect bank account)
   */
  async removeItem(accessToken: string): Promise<void> {
    try {
      await this.client.post('/item/remove', {
        ...this.getAuthBody(),
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Error removing item:', error);
      throw new Error('Failed to remove bank connection');
    }
  }

  /**
   * Get institution details
   */
  async getInstitution(institutionId: string): Promise<any> {
    try {
      const response = await this.client.post('/institutions/get_by_id', {
        ...this.getAuthBody(),
        institution_id: institutionId,
        country_codes: ['US'],
      });

      return response.data.institution;
    } catch (error) {
      console.error('Error fetching institution:', error);
      throw new Error('Failed to fetch institution details');
    }
  }

  /**
   * Map Plaid account type to our account type
   */
  private mapAccountType(plaidType: string): 'checking' | 'savings' | 'credit' | 'investment' {
    const typeMap: Record<string, 'checking' | 'savings' | 'credit' | 'investment'> = {
      depository: 'checking',
      credit: 'credit',
      loan: 'credit',
      investment: 'investment',
      brokerage: 'investment',
    };

    return typeMap[plaidType.toLowerCase()] || 'checking';
  }
}

// Singleton instance
let plaidClientInstance: PlaidClient | null = null;

export function initPlaidClient(config: PlaidConfig): PlaidClient {
  plaidClientInstance = new PlaidClient(config);
  return plaidClientInstance;
}

export function getPlaidClient(): PlaidClient {
  if (!plaidClientInstance) {
    // Initialize with environment variables
    plaidClientInstance = new PlaidClient({
      clientId: import.meta.env.VITE_PLAID_CLIENT_ID || '',
      secret: import.meta.env.VITE_PLAID_SECRET || '',
      environment: (import.meta.env.VITE_PLAID_ENV as any) || 'sandbox',
    });
  }
  return plaidClientInstance;
}
