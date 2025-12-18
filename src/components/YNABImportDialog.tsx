import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Account, AccountCategory, AccessType, Currency } from '@/types/finance';
import { YNABParsedAccount, stringSimilarity } from '@/lib/ynabParser';
import { ACCOUNT_CATEGORY_META } from '@/lib/accountMetadata';
import { Check, AlertTriangle, Plus, FileSpreadsheet, ArrowRight } from 'lucide-react';

export type MatchType = 'exact' | 'fuzzy' | 'new';

export interface AccountMapping {
  ynabAccount: YNABParsedAccount;
  matchType: MatchType;
  matchedAccount?: Account;
  fuzzyMatches?: { account: Account; similarity: number }[];
  selectedMatchId?: string;
  include: boolean;
  category: AccountCategory;
  accessType: AccessType;
  currency: Currency;
}

interface YNABImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedAccounts: YNABParsedAccount[];
  existingAccounts: Account[];
  defaultCurrency: Currency;
  format: 'register' | 'networth';
  onImport: (mappings: AccountMapping[]) => void;
}

const FUZZY_THRESHOLD = 0.6;

export const YNABImportDialog = ({
  open,
  onOpenChange,
  parsedAccounts,
  existingAccounts,
  defaultCurrency,
  format,
  onImport,
}: YNABImportDialogProps) => {
  // Initialize mappings with smart matching
  const initialMappings = useMemo((): AccountMapping[] => {
    return parsedAccounts.map((ynabAccount) => {
      // Check for exact match (case-insensitive)
      const exactMatch = existingAccounts.find(
        (acc) => acc.name.toLowerCase().trim() === ynabAccount.name.toLowerCase().trim()
      );

      if (exactMatch) {
        return {
          ynabAccount,
          matchType: 'exact' as MatchType,
          matchedAccount: exactMatch,
          selectedMatchId: exactMatch.id,
          include: true,
          category: exactMatch.category,
          accessType: exactMatch.accessType,
          currency: exactMatch.currency,
        };
      }

      // Check for fuzzy matches
      const fuzzyMatches = existingAccounts
        .map((acc) => ({
          account: acc,
          similarity: stringSimilarity(ynabAccount.name, acc.name),
        }))
        .filter((m) => m.similarity >= FUZZY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity);

      if (fuzzyMatches.length > 0) {
        return {
          ynabAccount,
          matchType: 'fuzzy' as MatchType,
          fuzzyMatches,
          selectedMatchId: undefined, // User must confirm
          include: true,
          category: ynabAccount.suggestedCategory,
          accessType: ynabAccount.suggestedAccessType,
          currency: defaultCurrency,
        };
      }

      // New account
      return {
        ynabAccount,
        matchType: 'new' as MatchType,
        include: true,
        category: ynabAccount.suggestedCategory,
        accessType: ynabAccount.suggestedAccessType,
        currency: defaultCurrency,
      };
    });
  }, [parsedAccounts, existingAccounts, defaultCurrency]);

  const [mappings, setMappings] = useState<AccountMapping[]>(initialMappings);

  const updateMapping = (index: number, updates: Partial<AccountMapping>) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...updates } : m))
    );
  };

  const handleSelectMatch = (index: number, accountId: string) => {
    const mapping = mappings[index];
    if (accountId === 'new') {
      // User chose to create new instead
      updateMapping(index, {
        matchType: 'new',
        selectedMatchId: undefined,
        matchedAccount: undefined,
      });
    } else {
      const matchedAccount = existingAccounts.find((a) => a.id === accountId);
      updateMapping(index, {
        selectedMatchId: accountId,
        matchedAccount,
        category: matchedAccount?.category || mapping.category,
        accessType: matchedAccount?.accessType || mapping.accessType,
        currency: matchedAccount?.currency || mapping.currency,
      });
    }
  };

  const summary = useMemo(() => {
    const included = mappings.filter((m) => m.include);
    const exact = included.filter((m) => m.matchType === 'exact').length;
    const fuzzyConfirmed = included.filter(
      (m) => m.matchType === 'fuzzy' && m.selectedMatchId
    ).length;
    const fuzzyUnconfirmed = included.filter(
      (m) => m.matchType === 'fuzzy' && !m.selectedMatchId
    ).length;
    const newAccounts = included.filter((m) => m.matchType === 'new').length;

    const totalAssets = included
      .filter((m) => m.category.includes('asset'))
      .reduce((sum, m) => sum + m.ynabAccount.balance, 0);
    const totalLiabilities = included
      .filter((m) => m.category.includes('liability'))
      .reduce((sum, m) => sum + m.ynabAccount.balance, 0);

    return {
      total: included.length,
      exact,
      fuzzyConfirmed,
      fuzzyUnconfirmed,
      newAccounts,
      totalAssets,
      totalLiabilities,
      canImport: fuzzyUnconfirmed === 0 && included.length > 0,
    };
  }, [mappings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleImport = () => {
    const includedMappings = mappings.filter((m) => m.include);
    onImport(includedMappings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import from YNAB
            <Badge variant="secondary" className="ml-2">
              {format === 'networth' ? 'Net Worth Report' : 'Transaction Register'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {summary.fuzzyUnconfirmed > 0 && (
          <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              {summary.fuzzyUnconfirmed} account(s) have potential matches that need your confirmation.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 transition-colors ${
                  !mapping.include ? 'opacity-50 bg-muted/30' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Include checkbox */}
                  <Checkbox
                    checked={mapping.include}
                    onCheckedChange={(checked) =>
                      updateMapping(index, { include: !!checked })
                    }
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Account name and match status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {mapping.ynabAccount.name}
                      </span>
                      <Badge
                        variant={
                          mapping.matchType === 'exact'
                            ? 'default'
                            : mapping.matchType === 'fuzzy'
                            ? 'secondary'
                            : 'outline'
                        }
                        className={
                          mapping.matchType === 'exact'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
                            : mapping.matchType === 'fuzzy'
                            ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
                            : ''
                        }
                      >
                        {mapping.matchType === 'exact' && (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Exact Match
                          </>
                        )}
                        {mapping.matchType === 'fuzzy' && (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Needs Confirmation
                          </>
                        )}
                        {mapping.matchType === 'new' && (
                          <>
                            <Plus className="h-3 w-3 mr-1" />
                            New Account
                          </>
                        )}
                      </Badge>
                      <span className="text-sm font-semibold ml-auto">
                        {formatCurrency(mapping.ynabAccount.balance)}
                      </span>
                    </div>

                    {/* Exact match display */}
                    {mapping.matchType === 'exact' && mapping.matchedAccount && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        Will update: <span className="font-medium text-foreground">{mapping.matchedAccount.name}</span>
                      </div>
                    )}

                    {/* Fuzzy match selector */}
                    {mapping.matchType === 'fuzzy' && mapping.fuzzyMatches && (
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          Match to existing account:
                        </label>
                        <Select
                          value={mapping.selectedMatchId || ''}
                          onValueChange={(value) => handleSelectMatch(index, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a match or create new..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mapping.fuzzyMatches.map((fm) => (
                              <SelectItem key={fm.account.id} value={fm.account.id}>
                                {fm.account.name} ({Math.round(fm.similarity * 100)}% match)
                              </SelectItem>
                            ))}
                            <SelectItem value="new">
                              <span className="flex items-center gap-1">
                                <Plus className="h-3 w-3" />
                                Create as new account
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* New account configuration */}
                    {(mapping.matchType === 'new' ||
                      (mapping.matchType === 'fuzzy' && !mapping.selectedMatchId)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Category
                          </label>
                          <Select
                            value={mapping.category}
                            onValueChange={(value: AccountCategory) =>
                              updateMapping(index, { category: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(ACCOUNT_CATEGORY_META).map(([key, meta]) => (
                                <SelectItem key={key} value={key}>
                                  {meta.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Access Type
                          </label>
                          <Select
                            value={mapping.accessType}
                            onValueChange={(value: AccessType) =>
                              updateMapping(index, { accessType: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="liquid">Liquid</SelectItem>
                              <SelectItem value="retirement">Retirement</SelectItem>
                              <SelectItem value="illiquid">Illiquid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Currency
                          </label>
                          <Select
                            value={mapping.currency}
                            onValueChange={(value: Currency) =>
                              updateMapping(index, { currency: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                              <SelectItem value="PHP">PHP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{summary.total} accounts</span>
            </div>
            {summary.exact > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  {summary.exact} updates
                </Badge>
              </div>
            )}
            {summary.newAccounts > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {summary.newAccounts} new
                </Badge>
              </div>
            )}
            <div className="ml-auto flex gap-4">
              <span className="text-muted-foreground">
                Assets: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.totalAssets)}</span>
              </span>
              <span className="text-muted-foreground">
                Liabilities: <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(summary.totalLiabilities)}</span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!summary.canImport}
          >
            Import {summary.total} Accounts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
