import { useState } from 'react';
import { Account, AccountCategory } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';
import { ACCOUNT_CATEGORY_META } from '@/lib/accountMetadata';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onQuickUpdate?: (id: string, balance: number) => void;
  showCurrentAssets?: boolean;
  showNonCurrentAssets?: boolean;
  showCurrentLiabilities?: boolean;
  showNonCurrentLiabilities?: boolean;
}

const CATEGORY_ORDER: AccountCategory[] = [
  'current_asset',
  'non_current_asset',
  'current_liability',
  'non_current_liability',
];

export const AccountList = ({ 
  accounts, 
  onEdit, 
  onDelete,
  onQuickUpdate,
  showCurrentAssets = true,
  showNonCurrentAssets = true,
  showCurrentLiabilities = true,
  showNonCurrentLiabilities = true,
}: AccountListProps) => {
  const [openCategories, setOpenCategories] = useState<Record<AccountCategory, boolean>>({
    current_asset: true,
    non_current_asset: true,
    current_liability: true,
    non_current_liability: true,
  });
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [editingBalance, setEditingBalance] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  
  const toggleCategory = (category: AccountCategory) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const startEditingBalance = (account: Account) => {
    setEditingBalanceId(account.id);
    setEditingBalance(account.balance.toString());
  };

  const cancelEditingBalance = () => {
    setEditingBalanceId(null);
    setEditingBalance('');
  };

  const saveBalance = (accountId: string) => {
    const newBalance = parseFloat(editingBalance);
    if (!isNaN(newBalance) && onQuickUpdate) {
      onQuickUpdate(accountId, newBalance);
    }
    setEditingBalanceId(null);
    setEditingBalance('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, accountId: string) => {
    if (e.key === 'Enter') {
      saveBalance(accountId);
    } else if (e.key === 'Escape') {
      cancelEditingBalance();
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      onDelete(accountToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };
  
  const visibilityMap: Record<AccountCategory, boolean> = {
    current_asset: showCurrentAssets,
    non_current_asset: showNonCurrentAssets,
    current_liability: showCurrentLiabilities,
    non_current_liability: showNonCurrentLiabilities,
  };

  if (accounts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No accounts yet. Add your first account to get started.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <ScrollArea className="h-[600px] pr-2 sm:pr-4">
          <div className="space-y-6">
            {CATEGORY_ORDER.map((category, categoryIndex) => {
              if (!visibilityMap[category]) return null;
              
              const categoryAccounts = accounts.filter(acc => acc.category === category);
              
              if (categoryAccounts.length === 0) return null;

              const meta = ACCOUNT_CATEGORY_META[category];
              const Icon = meta.icon;
              const isOpen = openCategories[category];

              return (
                <div key={category}>
                  {categoryIndex > 0 && <Separator className="mb-6" />}
                  
                  <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category)}>
                    <div className="mb-6">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full flex items-start justify-between px-1.5 py-2 hover:bg-muted/50 rounded-lg group"
                        >
                          <div className="flex items-start gap-2 flex-1">
                            <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-left flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  {meta.label}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {categoryAccounts.length}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 mb-3">
                                {meta.subtitle}
                              </p>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="mt-2 animate-accordion-down">
                      <div className="space-y-2 sm:space-y-3">
                        {categoryAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3 sm:gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                                <p className="font-medium text-foreground text-sm sm:text-base truncate">
                                  {account.name}
                                </p>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {account.currency}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                Updated: {new Date(account.lastUpdated).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                              {editingBalanceId === account.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={editingBalance}
                                    onChange={(e) => setEditingBalance(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, account.id)}
                                    className="w-28 h-8 text-sm"
                                    autoFocus
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => saveBalance(account.id)}
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={cancelEditingBalance}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onQuickUpdate && startEditingBalance(account)}
                                  className="text-base sm:text-lg font-semibold text-foreground flex-shrink-0 hover:text-primary transition-colors cursor-pointer"
                                  title="Click to edit balance"
                                >
                                  {formatCurrency(account.balance, account.currency)}
                                </button>
                              )}
                              
                              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onEdit(account)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(account)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{accountToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
