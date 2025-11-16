import { useState, useEffect } from 'react';
import { Account, AccountCategory, Currency, AccessType } from '@/types/finance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (account: Omit<Account, 'id' | 'lastUpdated'>) => void;
  editAccount?: Account | null;
}

export const AccountDialog = ({
  open,
  onOpenChange,
  onSave,
  editAccount,
}: AccountDialogProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AccountCategory>('current_asset');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [balance, setBalance] = useState('0');
  const [accessType, setAccessType] = useState<AccessType>('liquid');

  useEffect(() => {
    if (editAccount) {
      setName(editAccount.name);
      setCategory(editAccount.category);
      setCurrency(editAccount.currency);
      setBalance(editAccount.balance.toString());
      setAccessType(editAccount.accessType || 'liquid');
    } else {
      setName('');
      setCategory('current_asset');
      setCurrency('EUR');
      setBalance('0');
      setAccessType('liquid');
    }
  }, [editAccount, open]);

  const handleSave = () => {
    onSave({
      name,
      category,
      currency,
      balance: parseFloat(balance) || 0,
      accessType,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editAccount ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Checking Account, Mortgage"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AccountCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_asset">Current Asset</SelectItem>
                  <SelectItem value="non_current_asset">Non-Current Asset</SelectItem>
                  <SelectItem value="current_liability">Current Liability</SelectItem>
                  <SelectItem value="non_current_liability">Non-Current Liability</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="PHP">PHP (₱)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessType">Access Type</Label>
            <Select value={accessType} onValueChange={(v) => setAccessType(v as AccessType)}>
              <SelectTrigger id="accessType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liquid">Liquid</SelectItem>
                <SelectItem value="retirement">Retirement</SelectItem>
                <SelectItem value="illiquid">Illiquid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name}>
            {editAccount ? 'Update' : 'Add'} Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
