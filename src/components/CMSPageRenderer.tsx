import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { GameCard } from "./GameCard";
import { HeroSearchBar } from "./HeroSearchBar";
import { SectionTitle } from "./ui/SectionTitle";
import { SectionContainer } from "./ui/SectionContainer";
import { Container } from "./ui/Container";
import type { CMSSection } from "../lib/cms";

const componentMap: Record<string, React.ComponentType<any>> = {
  button: Button,
  badge: Badge,
  card: Card,
  game_card: GameCard,
  hero_search_bar: HeroSearchBar,
  section_title: SectionTitle,
  section_container: SectionContainer,
  container: Container,
};

interface CMSPageRendererProps {
  sections: CMSSection[];
  className?: string;
}

export function CMSPageRenderer({ sections, className }: CMSPageRendererProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className={cn("min-h-[400px] flex items-center justify-center bg-muted/20", className)}>
        <div className="text-center p-8">
          <p className="text-muted-foreground text-lg">Esta página aún no tiene contenido.</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Añade secciones desde el panel de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {sections
        .filter(s => s.is_visible)
        .sort((a, b) => a.order_index - b.order_index)
        .map((section) => {
          const Component = componentMap[section.component_slug];
          
          if (!Component) {
            return (
              <div 
                key={section.id} 
                className="p-4 bg-muted/10 border border-border m-2 rounded-lg"
              >
                <p className="text-sm text-muted-foreground">
                  Componente no encontrado: <code className="font-mono">{section.component_slug}</code>
                </p>
              </div>
            );
          }

          return (
            <div 
              key={section.id} 
              className={cn(
                "cms-section",
                section.is_locked && "opacity-75"
              )}
            >
              <Component {...section.props} />
            </div>
          );
        })}
    </div>
  );
}
