import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 border border-border p-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

function isEmpty(value: React.ReactNode) {
  return value === null || value === undefined || value === "";
}

export function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{isEmpty(value) ? "—" : value}</div>
    </div>
  );
}

export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
