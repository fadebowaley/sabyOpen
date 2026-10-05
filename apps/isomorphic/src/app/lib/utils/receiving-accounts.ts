export interface ReceivingAccount {
  id?: string;
  label: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  bankCategory?: string;
  accountName: string;
  isPrimary: boolean;
  isActive: boolean;
}

export const normalizeReceivingAccount = (
  account: Partial<ReceivingAccount> = {}
): ReceivingAccount => ({
  id: account.id || undefined,
  label: account.label || '',
  accountNumber: account.accountNumber || '',
  bankName: account.bankName || '',
  bankCode: account.bankCode || '',
  bankCategory: account.bankCategory || '',
  accountName: account.accountName || '',
  isPrimary: Boolean(account.isPrimary),
  isActive: account.isActive !== false,
});

export const normalizeReceivingAccounts = (
  accounts: Partial<ReceivingAccount>[] = []
): ReceivingAccount[] =>
  Array.isArray(accounts)
    ? accounts.map((account) => normalizeReceivingAccount(account))
    : [];

