import { Account, AccountCategory } from '@/types/finance';
import { formatCurrency, getCategoryLabel } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AccountListProps {
  accounts: Account[];
  category: AccountCategory;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountList = ({ accounts, category, onEdit, onDelete }: AccountListProps) => {
  const filteredAccounts = accounts.filter(acc => acc.category === category);

  if (filteredAccounts.length === 0) {
    return null;
  }

  const isAsset = category.includes('asset');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        {getCategoryLabel(category)}
      </h3>
      
      <ScrollArea className="h-[400px] pr-2 sm:pr-4">
        <div className="space-y-2 sm:space-y-3">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{account.name}</p>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {account.currency}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Updated: {new Date(account.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <p className={`text-lg sm:text-xl font-bold ${isAsset ? 'text-success' : 'text-destructive'} flex-shrink-0`}>
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
      </ScrollArea>
    </Card>
  );
};
