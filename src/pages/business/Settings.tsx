import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { updateBusinessSettings, useBusiness } from "@/lib/store";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Settings } from "lucide-react";

export default function BusinessSettings() {
  const { t } = useI18n();
  const business = useBusiness();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState(business.shopName);
  const [taxEnabled, setTaxEnabled] = useState(business.taxEnabled);
  const [taxRate, setTaxRate] = useState(String(business.taxRate));

  function handleSave() {
    updateBusinessSettings({
      shopName: shopName.trim(),
      taxEnabled,
      taxRate: Math.max(0, Math.min(100, Number(taxRate) || 0)),
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("nav.biz.settings")}</h1>
        <p className="text-sm text-muted-foreground">{t("system.business.name")}</p>
      </div>

      <div className="card-soft max-w-lg space-y-4 rounded-3xl border border-border/60 bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="shop">{t("biz.shopName")}</Label>
          <Input
            id="shop"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Shop"
            className="h-10 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">{t("biz.receipt")}: {business.shopName || "Flowday"}</p>
        </div>

        <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
          <span className="text-sm font-medium">{t("biz.taxEnabled")}</span>
          <Switch checked={taxEnabled} onCheckedChange={setTaxEnabled} />
        </label>

        {taxEnabled && (
          <div className="space-y-1.5">
            <Label htmlFor="tax">{t("biz.taxRate")}</Label>
            <Input
              id="tax"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
        )}

        <Button onClick={handleSave} className="w-full rounded-xl">
          {t("common.save")}
        </Button>
      </div>

      <Button variant="outline" onClick={() => navigate("/life/settings")} className="gap-2 rounded-xl">
        <Settings className="size-4" />
        {t("nav.settings")}
      </Button>
    </div>
  );
}
