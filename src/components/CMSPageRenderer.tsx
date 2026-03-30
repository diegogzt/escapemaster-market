import * as React from "react";
import { cn } from "../lib/utils";
import {
  Button,
  Badge,
  Card,
  Input,
  Container,
  SectionContainer,
  SectionTitle,
  GameGrid,
  GameCard,
  HeroSearchBar,
  HeroBanner,
  AdvancedFilters,
  AuthStatus,
  BookingWidget,
  ChatWidget,
  MapSearch,
  UserDashboard,
} from "@diegogzt/ui-components";
import { Header } from "./Header";
import { NearYouSection } from "./NearYouSection";
import { RouteBulkBooking } from "./react/RouteBulkBooking";
import { SingleGameMap } from "./react/SingleGameMap";
import { SocialFeed } from "./react/SocialFeed";
import { OnboardingFlow } from "./react/OnboardingFlow";
import type { CMSSection } from "../lib/cms";

const componentMap: Record<string, React.ComponentType<any>> = {
  "button": Button,
  "badge": Badge,
  "card": Card,
  "input": Input,
  "container": Container,
  "section-container": SectionContainer,
  "section-title": SectionTitle,
  "game-card": GameCard,
  "game-grid": GameGrid,
  "hero-banner": HeroBanner,
  "hero-search-bar": HeroSearchBar,
  "header": Header,
  "footer": () => null,
  "near-you-section": NearYouSection,
  "advanced-filters": AdvancedFilters,
  "auth-status": AuthStatus,
  "booking-widget": BookingWidget,
  "chat-widget": ChatWidget,
  "map-search": MapSearch,
  "route-bulk-booking": RouteBulkBooking,
  "single-game-map": SingleGameMap,
  "social-feed": SocialFeed,
  "user-dashboard": UserDashboard,
  "route-card": Card,
};

interface CMSPageRendererProps {
  sections: CMSSection[];
  className?: string;
}

export function CMSPageRenderer({ sections, className }: CMSPageRendererProps) {
  console.log('[CMSPageRenderer] Rendering sections:', sections?.length);
  
  if (!sections || sections.length === 0) {
    return (
      <div className={cn("min-h-[400px] flex items-center justify-center bg-muted/20", className)}>
        <div className="text-center p-8">
          <p className="text-tropical-text text-lg">Esta página aún no tiene contenido.</p>
          <p className="text-tropical-text/60 text-sm mt-2">Añade secciones desde el panel de administración.</p>
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
                className="p-4 bg-tropical-card/50 border border-border m-2 rounded-lg"
              >
                <p className="text-sm text-tropical-text">
                  Componente no encontrado: <code className="font-mono text-tropical-primary">{section.component_slug}</code>
                </p>
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary>Props disponibles</summary>
                  <pre className="mt-1 p-2 bg-muted rounded overflow-auto">
                    {JSON.stringify(section.props, null, 2)}
                  </pre>
                </details>
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
