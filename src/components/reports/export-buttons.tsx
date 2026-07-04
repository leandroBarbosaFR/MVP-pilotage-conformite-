"use client";

import { useState } from "react";
import { FilePdfIcon, FileXlsIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";

export function ExportButtons() {
  const [message, setMessage] = useState(false);

  function notify() {
    setMessage(true);
    setTimeout(() => setMessage(false), 3000);
  }

  return (
    <div className="flex items-center gap-2">
      {message ? (
        <span className="text-xs text-muted-foreground">Export bientôt disponible</span>
      ) : null}
      <Button variant="outline" size="sm" onClick={notify}>
        <FilePdfIcon size={16} />
        Exporter PDF
      </Button>
      <Button variant="outline" size="sm" onClick={notify}>
        <FileXlsIcon size={16} />
        Exporter Excel
      </Button>
    </div>
  );
}
