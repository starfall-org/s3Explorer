"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Globe, Server } from "lucide-react";
import { ConnectionMode } from "@/utils/s3Types";
import { cn } from "@/lib/utils";

interface ConnectionModeSelectorProps {
  value: ConnectionMode;
  onChange: (mode: ConnectionMode) => void;
}

export function ConnectionModeSelector({
  value,
  onChange,
}: ConnectionModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Connection Mode
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as ConnectionMode)}
        className="grid grid-cols-1 gap-2"
      >
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors",
            value === "browser"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          )}
        >
          <RadioGroupItem
            value="browser"
            id="connection-mode-browser"
            className="mt-0.5"
          />
          <Label
            htmlFor="connection-mode-browser"
            className="flex-1 cursor-pointer space-y-1 font-normal"
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Globe className="h-4 w-4 text-primary" />
              Browser
            </span>
            <span className="block text-xs text-muted-foreground">
              Connect directly from the browser. Requires the endpoint to support CORS.
            </span>
          </Label>
        </div>

        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors",
            value === "server"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          )}
        >
          <RadioGroupItem
            value="server"
            id="connection-mode-server"
            className="mt-0.5"
          />
          <Label
            htmlFor="connection-mode-server"
            className="flex-1 cursor-pointer space-y-1 font-normal"
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Server className="h-4 w-4 text-primary" />
              Server
            </span>
            <span className="block text-xs text-muted-foreground">
              Connect through the server proxy. No CORS needed.
            </span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
