import { useState, useMemo, useEffect } from 'react';
import { Account, Currency, NetWorthSummary, ConversionRate } from '@/types/finance';
import { HistorySnapshot } from '@/types/history';
import { RetirementInputs } from '@/types/retirement';
import { NetWorthCard } from '@/components/NetWorthCard';
import { AccountList } from '@/components/AccountList';
import { AccountDialog } from '@/components/AccountDialog';
import { ConversionRateDialog } from '@/components/ConversionRateDialog';
import { FinancialCharts } from '@/components/FinancialCharts';
import { RetirementCalculator } from '@/components/RetirementCalculator';
import { RetirementPlanning } from '@/components/RetirementPlanning';
import { HistoryLog } from '@/components/HistoryLog';
import { ViewToggles } from '@/components/ViewToggles';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, RefreshCw, Save, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { defaultConversionRates } from '@/lib/currency';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const getRateToEUR = (currency: Currency, conversionRates: ConversionRate[]): number => {
  if (currency === 'EUR') return 1;
  const rate = conversionRates.find((r) => r.currency === currency);
  return rate?.rate ?? 0;
};

const Index = () => {
  const [accounts, setAccounts] = useLocalStorage<Account[]>('networth-accounts', []);
  const [conversionRates, setConversionRates] = useLocalStorage<ConversionRate[]>(
    'networth-rates',
    defaultConversionRates
  );
  const [history, setHistory] = useLocalStorage<HistorySnapshot[]>('networth-history', []);
  const [monthlyExpenses, setMonthlyExpenses] = useLocalStorage<number>('networth-expenses', 0);
  const [retirementInputs, setRetirementInputs] = useLocalStorage<RetirementInputs | undefined>(
    'retirement-inputs',
    undefined
  );
  const [showCurrentAssets, setShowCurrentAssets] = useLocalStorage('show-current-assets', true);
  const [showNonCurrentAssets, setShowNonCurrentAssets] = useLocalStorage('show-non-current-assets', true);
  const [showCurrentLiabilities, setShowCurrentLiabilities] = useLocalStorage('show-current-liabilities', true);
  const [showNonCurrentLiabilities, setShowNonCurrentLiabilities] = useLocalStorage('show-non-current-liabilities', true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [ratesDialogOpen, setRatesDialogOpen] = useState(false);
  const { toast } = useToast();

  const summary: NetWorthSummary = useMemo(() => {
    const usedCurrencies = Array.from(new Set<Currency>(accounts.map(a => a.currency)));
    const currencies: Currency[] = usedCurrencies.includes('EUR')
      ? usedCurrencies
      : (['EUR', ...usedCurrencies] as Currency[]);
    
    const result: NetWorthSummary = {
      totalAssets: {} as Record<Currency, number>,
      totalLiabilities: {} as Record<Currency, number>,
      netWorth: {} as Record<Currency, number>,
      totalAssetsEUR: 0,
      totalLiabilitiesEUR: 0,
      netWorthEUR: 0,
    };

    currencies.forEach((currency) => {
      const assets = accounts
        .filter((acc) => acc.currency === currency && acc.category.includes('asset'))
        .reduce((sum, acc) => sum + acc.balance, 0);

      const liabilities = accounts
        .filter((acc) => acc.currency === currency && acc.category.includes('liability'))
        .reduce((sum, acc) => sum + acc.balance, 0);

      result.totalAssets[currency] = assets;
      result.totalLiabilities[currency] = liabilities;
      result.netWorth[currency] = assets - liabilities;

      // Convert to EUR
      const rate = getRateToEUR(currency, conversionRates);
      result.totalAssetsEUR += assets * rate;
      result.totalLiabilitiesEUR += liabilities * rate;
    });

    result.netWorthEUR = result.totalAssetsEUR - result.totalLiabilitiesEUR;

    return result;
  }, [accounts, conversionRates]);

  const liquidNetWorth = useMemo(() => {
    const liquidAssets = accounts
      .filter((acc) => acc.category.includes('asset') && (acc.accessType === 'liquid' || !acc.accessType))
      .reduce((sum, acc) => sum + acc.balance * getRateToEUR(acc.currency, conversionRates), 0);

    const liquidLiabilities = accounts
      .filter((acc) => acc.category.includes('liability') && (acc.accessType === 'liquid' || !acc.accessType))
      .reduce((sum, acc) => sum + acc.balance * getRateToEUR(acc.currency, conversionRates), 0);

    return liquidAssets - liquidLiabilities;
  }, [accounts, conversionRates]);

  const handleSaveAccount = (accountData: Omit<Account, 'id' | 'lastUpdated'>) => {
    if (editAccount) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === editAccount.id
            ? { ...accountData, id: acc.id, lastUpdated: new Date() }
            : acc
        )
      );
      toast({
        title: 'Account updated',
        description: `${accountData.name} has been updated successfully.`,
      });
    } else {
      const newAccount: Account = {
        ...accountData,
        id: crypto.randomUUID(),
        lastUpdated: new Date(),
      };
      setAccounts((prev) => [...prev, newAccount]);
      toast({
        title: 'Account added',
        description: `${accountData.name} has been added successfully.`,
      });
    }
    setEditAccount(null);
  };

  const handleEditAccount = (account: Account) => {
    setEditAccount(account);
    setDialogOpen(true);
  };

  const handleDeleteAccount = (id: string) => {
    const account = accounts.find((acc) => acc.id === id);
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    toast({
      title: 'Account deleted',
      description: `${account?.name} has been removed.`,
      variant: 'destructive',
    });
  };

  const handleAddNew = () => {
    setEditAccount(null);
    setDialogOpen(true);
  };

  const handleSaveRates = (rates: ConversionRate[]) => {
    setConversionRates(rates);
    toast({
      title: 'Conversion rates updated',
      description: 'Your currency conversion rates have been saved.',
    });
  };

  const handleToggleView = (key: string, value: boolean) => {
    switch (key) {
      case 'showCurrentAssets':
        setShowCurrentAssets(value);
        break;
      case 'showNonCurrentAssets':
        setShowNonCurrentAssets(value);
        break;
      case 'showCurrentLiabilities':
        setShowCurrentLiabilities(value);
        break;
      case 'showNonCurrentLiabilities':
        setShowNonCurrentLiabilities(value);
        break;
    }
  };

  const saveSnapshot = () => {
    const snapshot: HistorySnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      netWorthEUR: summary.netWorthEUR,
      totalAssetsEUR: summary.totalAssetsEUR,
      totalLiabilitiesEUR: summary.totalLiabilitiesEUR,
      liquidNetWorthEUR: liquidNetWorth,
      accountCount: accounts.length,
    };
    setHistory((prev) => [...prev, snapshot]);
    toast({
      title: 'Snapshot saved',
      description: 'Your current financial state has been recorded in history.',
    });
  };

  const deleteSnapshot = (id: string) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: 'Snapshot deleted',
      description: 'History entry has been removed.',
    });
  };

  const duplicateSnapshot = (snapshot: HistorySnapshot) => {
    const duplicated: HistorySnapshot = {
      ...snapshot,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setHistory((prev) => [...prev, duplicated]);
    toast({
      title: 'Snapshot duplicated',
      description: 'A copy of this snapshot has been created.',
    });
  };

  const clearHistory = () => {
    setHistory(() => []);
    toast({
      title: 'History cleared',
      description: 'All snapshots have been removed.',
    });
  };

  const handleExportData = () => {
    const backupData = {
      accounts,
      conversionRates,
      history,
      monthlyExpenses,
      retirementInputs,
      showCurrentAssets,
      showNonCurrentAssets,
      showCurrentLiabilities,
      showNonCurrentLiabilities,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `networth-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Data exported',
      description: 'Your backup file has been downloaded.',
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid backup file format');
        }

        // Restore data
        if (data.accounts) setAccounts(data.accounts);
        if (data.conversionRates) setConversionRates(data.conversionRates);
        if (data.history) setHistory(data.history);
        if (data.monthlyExpenses !== undefined) setMonthlyExpenses(data.monthlyExpenses);
        if (data.retirementInputs !== undefined) setRetirementInputs(data.retirementInputs);
        if (data.showCurrentAssets !== undefined) setShowCurrentAssets(data.showCurrentAssets);
        if (data.showNonCurrentAssets !== undefined) setShowNonCurrentAssets(data.showNonCurrentAssets);
        if (data.showCurrentLiabilities !== undefined) setShowCurrentLiabilities(data.showCurrentLiabilities);
        if (data.showNonCurrentLiabilities !== undefined) setShowNonCurrentLiabilities(data.showNonCurrentLiabilities);

        toast({
          title: 'Data imported',
          description: 'Your backup has been restored successfully.',
        });

        // Reset file input
        event.target.value = '';
      } catch (error) {
        toast({
          title: 'Import failed',
          description: 'Unable to read backup file. Please check the file format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  // Auto-save snapshot when accounts change significantly
  useEffect(() => {
    if (accounts.length > 0 && history.length === 0) {
      // Save first snapshot automatically
      const snapshot: HistorySnapshot = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        netWorthEUR: summary.netWorthEUR,
        totalAssetsEUR: summary.totalAssetsEUR,
        totalLiabilitiesEUR: summary.totalLiabilitiesEUR,
        liquidNetWorthEUR: liquidNetWorth,
        accountCount: accounts.length,
      };
      setHistory([snapshot]);
    }
  }, [accounts.length]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-4xl font-bold text-foreground">Net Worth Tracker</h1>
                <p className="text-muted-foreground">
                  Track your financial position across multiple currencies
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveSnapshot}
                disabled={accounts.length === 0}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Snapshot
              </Button>
              <Button
                variant="outline"
                onClick={() => setRatesDialogOpen(true)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Conversion Rates
              </Button>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Backup & Restore</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 relative"
                asChild
              >
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Import Data
                  <input
                    id="import-file"
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Net Worth Summary Card */}
        <div className="mb-8">
          <NetWorthCard
            assetsEUR={summary.totalAssetsEUR}
            liabilitiesEUR={summary.totalLiabilitiesEUR}
            isMainCard={true}
          />
          
          {/* Liquid vs Total Net Worth */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Liquid Net Worth</p>
              <p className={`text-2xl font-bold ${liquidNetWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {liquidNetWorth.toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
              <p className={`text-2xl font-bold ${summary.netWorthEUR >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.netWorthEUR.toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Currency Net Worth Strip */}
        {accounts.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(summary.netWorth).map(([currency, amount]) => (
              amount !== 0 && (
                <div key={currency} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{currency}</span>
                    <span className={`text-sm font-semibold ${amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* View Controls */}
        <div className="mb-8">
          <ViewToggles
            showCurrentAssets={showCurrentAssets}
            showNonCurrentAssets={showNonCurrentAssets}
            showCurrentLiabilities={showCurrentLiabilities}
            showNonCurrentLiabilities={showNonCurrentLiabilities}
            onToggle={handleToggleView}
          />
        </div>

        {/* Retirement Calculator */}
        <div className="mb-8">
          <RetirementCalculator
            liquidNetWorthEUR={liquidNetWorth}
            monthlyExpenses={monthlyExpenses}
            onMonthlyExpensesChange={setMonthlyExpenses}
          />
        </div>

        {/* Retirement Planning Module */}
        <div className="mb-8">
          <RetirementPlanning
            liquidNetWorthEUR={liquidNetWorth}
            monthlyExpenses={monthlyExpenses}
            onInputsChange={setRetirementInputs}
            savedInputs={retirementInputs}
          />
        </div>

        {/* Visual Charts */}
        <FinancialCharts accounts={accounts} conversionRates={conversionRates} />

        {/* History Log */}
        {history.length > 0 && (
          <div className="mt-8">
          <HistoryLog 
            snapshots={history}
            onDelete={deleteSnapshot}
            onDuplicate={duplicateSnapshot}
            onClearAll={clearHistory}
          />
          </div>
        )}

        {/* Add Account Button */}
        <div className="mb-6">
          <Button onClick={handleAddNew} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Add Account
          </Button>
        </div>

        {/* Account Lists */}
        {accounts.length > 0 ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Assets</h2>
                {showCurrentAssets && (
                  <AccountList
                    accounts={accounts}
                    category="current_asset"
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                  />
                )}
                {showNonCurrentAssets && (
                  <AccountList
                    accounts={accounts}
                    category="non_current_asset"
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                  />
                )}
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Liabilities</h2>
                {showCurrentLiabilities && (
                  <AccountList
                    accounts={accounts}
                    category="current_liability"
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                  />
                )}
                {showNonCurrentLiabilities && (
                  <AccountList
                    accounts={accounts}
                    category="non_current_liability"
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No accounts yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start tracking your net worth by adding your first account
            </p>
            <Button onClick={handleAddNew} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Your First Account
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <AccountDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleSaveAccount}
          editAccount={editAccount}
        />
        
        <ConversionRateDialog
          open={ratesDialogOpen}
          onOpenChange={setRatesDialogOpen}
          rates={conversionRates}
          onSave={handleSaveRates}
        />
      </div>
    </div>
  );
};

export default Index;
