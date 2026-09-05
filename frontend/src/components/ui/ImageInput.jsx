import { useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { cn } from "../../utils/cn.js";
import { fileToDataUrl } from "../../utils/image.js";
import { useI18n } from "../../i18n/index.jsx";
import { Avatar } from "./Avatar.jsx";
import { Button } from "./Button.jsx";
import { Input } from "./Form.jsx";
import { useToast } from "./Toast.jsx";

/** Image picker: upload a file (compressed client-side) or paste an image URL. */
export function ImageInput({ value, onChange, name = "", shape = "square", size = "xl", hint, className, id, disabled }) {
  const { t } = useI18n();
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const isData = typeof value === "string" && value.startsWith("data:");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToDataUrl(file));
    } catch (err) {
      toast.error(t(err?.code === "TOO_LARGE" ? "errors.imageTooLarge" : "errors.invalidImage"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex items-start gap-4", className)}>
      <Avatar src={value} name={name} size={size} shape={shape} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={Upload} loading={busy} disabled={disabled} onClick={() => inputRef.current?.click()}>
            {t("common.upload")}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" leftIcon={Trash2} disabled={disabled} onClick={() => onChange("")} className="text-fg-muted hover:text-danger">
              {t("common.remove")}
            </Button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={pick} aria-label={t("common.upload")} tabIndex={-1} />
        </div>
        <Input id={id} size="sm" type="url" placeholder={t("common.orPasteUrl")} value={isData ? "" : value || ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
        {hint && <p className="text-xs text-fg-muted">{hint}</p>}
      </div>
    </div>
  );
}
