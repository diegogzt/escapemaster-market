/**
 * Analytics tracking utility with event batching
 * Collects user behavior data and sends to backend API
 */

interface TrackingEvent {
  event_name: string;
  properties?: Record<string, any>;
}

interface AnalyticsPayload {
  events: TrackingEvent[];
  session_id: string;
  user_id?: string;
  timestamp: string;
}

class Analytics {
  private sessionId: string;
  private userId: string | null = null;
  private batch: TrackingEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds
  private isInitialized = false;

  constructor() {
    if (typeof window === 'undefined') return;

    this.sessionId = this.getOrCreateSessionId();
    this.initializeUser();
    this.setupBatchFlush();
    this.trackPageView();
    this.isInitialized = true;
  }

  private getOrCreateSessionId(): string {
    if (typeof sessionStorage === 'undefined') return '';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private initializeUser(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const userStr = localStorage.getItem('em_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.userId = user.id;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Track custom event
  track(event: TrackingEvent): void {
    if (!this.isInitialized) return;

    this.batch.push(event);
    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  // Track page view (called on route change)
  trackPageView(): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    this.track({
      event_name: 'page_view',
      properties: {
        page_path: window.location.pathname,
        page_lang: this.getLanguage(),
        referrer: document.referrer,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_type: this.getDeviceType(),
      },
    });
  }

  // Track click with coordinates for heatmap
  trackClick(x: number, y: number, target?: string): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    this.track({
      event_name: 'click',
      properties: {
        click_x: Math.round(x),
        click_y: Math.round(y),
        page_path: window.location.pathname,
        target_element: target,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      },
    });
  }

  // Track booking funnel progression
  trackBookingStep(step: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) return;

    this.track({
      event_name: 'booking_step',
      properties: {
        step,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        ...properties,
      },
    });
  }

  // Track search/filter events
  trackSearch(filters: Record<string, any>): void {
    if (!this.isInitialized) return;

    this.track({
      event_name: 'search_filter',
      properties: {
        ...filters,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      },
    });
  }

  // Track sort selection
  trackSort(sortBy: string): void {
    if (!this.isInitialized) return;

    this.track({
      event_name: 'search_sort',
      properties: {
        sort_by: sortBy,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      },
    });
  }

  // Track form submission
  trackFormSubmit(formName: string, success: boolean, properties: Record<string, any> = {}): void {
    if (!this.isInitialized) return;

    this.track({
      event_name: 'form_submit',
      properties: {
        form_name: formName,
        success,
        ...properties,
      },
    });
  }

  // Track auth events
  trackAuth(authEvent: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    this.track({
      event_name: authEvent,
      properties,
    });
  }

  // Batch flush
  private async flush(): Promise<void> {
    if (this.batch.length === 0 || typeof window === 'undefined') return;

    const events = this.batch.splice(0, this.batch.length);
    const payload: AnalyticsPayload = {
      events,
      session_id: this.sessionId,
      user_id: this.userId || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      const apiBase = (import.meta.env.PUBLIC_API_URL as string) || 'http://localhost:8000/v1/api';
      await fetch(`${apiBase}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (e) {
      // Re-queue failed events
      this.batch.unshift(...events);
      console.error('[Analytics] Flush failed:', e);
    }
  }

  private setupBatchFlush(): void {
    if (typeof window === 'undefined') return;

    // Periodic flush
    this.batchTimer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush();
      }
    }, this.BATCH_TIMEOUT);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.batch.length > 0) {
        this.flush();
      }
    });
  }

  private getLanguage(): string {
    if (typeof window === 'undefined') return 'es';
    const path = window.location.pathname;
    return path.startsWith('/en') ? 'en' : 'es';
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  destroy(): void {
    if (this.batchTimer) clearInterval(this.batchTimer);
    this.flush();
  }
}

// Export singleton
export const analytics = new Analytics();

// Declare global window type
declare global {
  interface Window {
    analytics?: typeof analytics;
  }
}
