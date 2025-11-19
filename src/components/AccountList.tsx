import { useState } from 'react';
import { Account, AccountCategory } from '@/types/finance';
import { formatCurrency } from '@/lib/currency';
import { ACCOUNT_CATEGORY_META } from '@/lib/accountMetadata';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
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
  
  const toggleCategory = (category: AccountCategory) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex items-start justify-between p-2 -ml-2 hover:bg-muted/50 rounded-lg group"
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
                          <p className="text-sm text-muted-foreground mt-1">
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

                  <CollapsibleContent className="animate-accordion-down">
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
                            <p className="text-base sm:text-lg font-semibold text-foreground flex-shrink-0">
                              {formatCurrency(account.balance, account.currency)}
                            </p>
                            
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
                                onClick={() => onDelete(account.id)}
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
  );
};
