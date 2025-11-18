import { useState, useEffect } from 'react';
import { ConversionRate, Currency } from '@/types/finance';
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
import { Card } from '@/components/ui/card';
import { currencySymbols } from '@/lib/currency';
import { ExternalLink } from 'lucide-react';

interface ConversionRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rates: ConversionRate[];
  onSave: (rates: ConversionRate[]) => void;
}

export const ConversionRateDialog = ({
  open,
  onOpenChange,
  rates,
  onSave,
}: ConversionRateDialogProps) => {
  const [localRates, setLocalRates] = useState<ConversionRate[]>(rates);

  useEffect(() => {
    setLocalRates(rates);
  }, [rates, open]);

  const updateRate = (currency: Currency, value: string) => {
    const rate = parseFloat(value) || 0;
    setLocalRates((prev) =>
      prev.map((r) => (r.currency === currency ? { ...r, rate } : r))
    );
  };

  const handleSave = () => {
    onSave(localRates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Conversion Rates to EUR</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Set how much 1 unit of each currency equals in EUR
            </p>
            <a 
              href="https://www.xe.com/currencyconverter/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Get accurate rates from XE.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {localRates.map((rateData) => (
            <Card key={rateData.currency} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor={`rate-${rateData.currency}`}>
                    1 {rateData.currency} {currencySymbols[rateData.currency]} = ? EUR €
                  </Label>
                </div>
                <div className="w-32">
                  <Input
                    id={`rate-${rateData.currency}`}
                    type="number"
                    step="0.0001"
                    value={rateData.rate}
                    onChange={(e) => updateRate(rateData.currency, e.target.value)}
                    disabled={rateData.currency === 'EUR'}
                    className="text-right"
                  />
                </div>
              </div>
            </Card>
          ))}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Example: If 1 USD = 0.92 EUR, enter 0.92 for USD
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Rates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
