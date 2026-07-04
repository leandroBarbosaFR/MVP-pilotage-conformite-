"use client";

import { useCallback, useEffect } from "react";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const STORAGE_KEY = "cpme_tour_done_v1";

const STEPS: DriveStep[] = [
  {
    element: "[data-tour='nav']",
    popover: {
      title: "Navigation",
      description:
        "Accédez à chaque module : personnel, EPI, équipements, véhicules, contrôles réglementaires, documents, actions et alertes. Les modules visibles dépendent de votre rôle.",
    },
  },
  {
    element: "[data-tour='stats']",
    popover: {
      title: "Indicateurs clés",
      description:
        "Votre conformité en un coup d'œil : taux conforme, éléments à surveiller, éléments critiques, actions en retard et documents manquants.",
    },
  },
  {
    element: "[data-tour='alerts']",
    popover: {
      title: "Alertes prioritaires",
      description:
        "Les échéances dépassées et proches, avec le responsable et le superviseur concernés.",
    },
  },
  {
    element: "[data-tour='score']",
    popover: {
      title: "Score de conformité",
      description: "La répartition conforme / à surveiller / critique de vos obligations.",
    },
  },
  {
    element: "[data-tour='actions']",
    popover: {
      title: "Actions à réaliser",
      description:
        "Le plan d'action : qui fait quoi, pour quand, avec la priorité et le statut.",
    },
  },
];

export function DashboardTour() {
  const start = useCallback(() => {
    const steps = STEPS.filter((s) =>
      typeof s.element === "string" ? document.querySelector(s.element) : true
    );
    if (steps.length === 0) return;
    driver({
      showProgress: true,
      nextBtnText: "Suivant",
      prevBtnText: "Précédent",
      doneBtnText: "Terminer",
      progressText: "{{current}} / {{total}}",
      steps,
    }).drive();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    localStorage.setItem(STORAGE_KEY, "1");
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
  }, [start]);

  return (
    <button
      type="button"
      onClick={start}
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
    >
      <QuestionIcon size={16} className="text-accent" />
      Visite guidée
    </button>
  );
}
