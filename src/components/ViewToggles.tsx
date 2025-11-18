import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eye } from 'lucide-react';

interface ViewTogglesProps {
  showCurrentAssets: boolean;
  showNonCurrentAssets: boolean;
  showCurrentLiabilities: boolean;
  showNonCurrentLiabilities: boolean;
  onToggle: (key: string, value: boolean) => void;
}

export const ViewToggles = ({
  showCurrentAssets,
  showNonCurrentAssets,
  showCurrentLiabilities,
  showNonCurrentLiabilities,
  onToggle,
}: ViewTogglesProps) => {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">View Controls</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Assets</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="current-assets" className="text-xs sm:text-sm font-medium">
                Current Assets (Liquid)
              </Label>
              <Switch
                id="current-assets"
                checked={showCurrentAssets}
                onCheckedChange={(checked) => onToggle('showCurrentAssets', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="non-current-assets" className="text-xs sm:text-sm font-medium">
                Non-Current Assets (Illiquid)
              </Label>
              <Switch
                id="non-current-assets"
                checked={showNonCurrentAssets}
                onCheckedChange={(checked) => onToggle('showNonCurrentAssets', checked)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Liabilities</h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="current-liabilities" className="text-xs sm:text-sm font-medium">
                Current Liabilities
              </Label>
              <Switch
                id="current-liabilities"
                checked={showCurrentLiabilities}
                onCheckedChange={(checked) => onToggle('showCurrentLiabilities', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="non-current-liabilities" className="text-xs sm:text-sm font-medium">
                Non-Current Liabilities
              </Label>
              <Switch
                id="non-current-liabilities"
                checked={showNonCurrentLiabilities}
                onCheckedChange={(checked) => onToggle('showNonCurrentLiabilities', checked)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <strong>Tip:</strong> Toggle off non-current assets and liabilities to focus on your
          liquid net worth for retirement planning.
        </p>
      </div>
    </Card>
  );
};
