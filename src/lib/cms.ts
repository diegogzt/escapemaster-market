import { query } from './db';

const CMS_API_URL = import.meta.env.PUBLIC_CMS_API_URL || 'http://localhost:4322';

export interface CMSSection {
  id: string;
  section_key: string;
  component_id: string;
  component_name: string;
  component_slug: string;
  component_type: string;
  component_path: string;
  title: string | null;
  props: Record<string, any>;
  order_index: number;
  is_visible: boolean;
  is_locked: boolean;
}

export interface CMSPage {
  id: string;
  slug: string;
  title_es: string;
  title_en: string | null;
  description_es: string | null;
  description_en: string | null;
  route_pattern: string;
  page_type: string;
  template: string | null;
  layout_component: string | null;
  is_system: boolean;
  is_visible_es?: boolean;
  is_visible_en?: boolean;
}

export interface CMSPageWithSections extends CMSPage {
  sections: CMSSection[];
  seo?: any[];
}

export async function getCMSSections(pageId: string): Promise<CMSSection[]> {
  const { rows } = await query(`
    SELECT ps.*, dc.name as component_name, dc.slug as component_slug, 
           dc.component_type, dc.component_path, dc.default_props, 
           dc.editable_props, dc.variants
    FROM page_sections ps
    JOIN design_components dc ON ps.component_id = dc.id
    WHERE ps.page_id = $1
    ORDER BY ps.order_index
  `, [pageId]);

  return rows.map((s: any) => ({
    id: s.id,
    section_key: s.section_key,
    component_id: s.component_id,
    component_name: s.component_name,
    component_slug: s.component_slug,
    component_type: s.component_type,
    component_path: s.component_path,
    title: s.title,
    props: typeof s.props === 'string' ? JSON.parse(s.props) : (s.props || {}),
    order_index: s.order_index,
    is_visible: s.is_visible,
    is_locked: s.is_locked
  }));
}

export async function getCMSPageBySlug(slug: string, locale: string = 'es'): Promise<CMSPageWithSections | null> {
  const { rows } = await query(`
    SELECT * FROM site_pages WHERE slug = $1
  `, [slug]);

  if (rows.length === 0) return null;

  const page = rows[0];
  const sections = await getCMSSections(page.id);

  return {
    id: page.id,
    slug: page.slug,
    title_es: page.title_es,
    title_en: page.title_en,
    description_es: page.description_es,
    description_en: page.description_en,
    route_pattern: page.route_pattern,
    page_type: page.page_type,
    template: page.template,
    layout_component: page.layout_component,
    is_system: page.is_system,
    sections
  };
}

export async function getCMSPageFromAPI(slug: string, locale: string = 'es'): Promise<CMSPageWithSections | null> {
  try {
    const baseUrl = CMS_API_URL.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/api/cms/public/pages/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`CMS API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'CMS API returned error');
    }

    const { page } = result.data;
    
    const isVisible = locale === 'en' ? page.is_visible_en : page.is_visible_es;
    
    if (isVisible === false) {
      return null;
    }

    return page;
  } catch (error) {
    console.error('Error fetching CMS page from API:', error);
    return null;
  }
}

export async function getPageVisibility(pageId: string, locale: string) {
  const { rows } = await query(`
    SELECT is_visible FROM page_visibility 
    WHERE page_id = $1 AND locale = $2
  `, [pageId, locale]);
  
  return rows.length > 0 ? rows[0].is_visible : true;
}

export async function getPageSEO(pageId: string, locale: string) {
  const { rows } = await query(`
    SELECT * FROM page_seo 
    WHERE page_id = $1 AND locale = $2
  `, [pageId, locale]);
  
  return rows.length > 0 ? rows[0] : null;
}

export function isCMSEditorialPage(pageType: string): boolean {
  return ['landing', 'content', 'default'].includes(pageType);
}
