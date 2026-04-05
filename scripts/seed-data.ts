/**
 * Seed script: Insert real escape room data from almacen backup into marketdb
 * Creates 7 organizations, ~50 rooms with images/coords, 4 routes, 2 teams
 * Idempotent — safe to re-run (uses ON CONFLICT)
 *
 * Usage: npx tsx scripts/seed-data.ts
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://root:Diegoelmejor1.0@45.90.237.112:5432/marketdb',
});

interface AlmacenRoom {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration: string;
  community: string;
  locality: string;
  address: string;
  latitude: string;
  longitude: string;
  image_url: string;
  min_people: string;
  max_people: string;
  price_eur: string;
  email: string;
  phone: string;
  slogan: string;
  themes: any;
  with_actors: any;
  google_rating: string | null;
  tripadvisor_rating: string | null;
  key_features: string | null;
  video_url: string | null;
  url: string | null;
}

// Organization definitions mapped to communities
const ORGS = [
  { name: 'Escape Factory Madrid', slug: 'escape-factory-madrid', community: ['Comunidad de Madrid', 'Madrid'] },
  { name: 'Mystery Rooms Barcelona', slug: 'mystery-rooms-barcelona', community: ['Cataluña', 'Catañuña'] },
  { name: 'Enigma Valencia', slug: 'enigma-valencia', community: ['Comunidad Valenciana'] },
  { name: 'Terror Labs Andalucía', slug: 'terror-labs-andalucia', community: ['Andalucía', 'Sevilla'] },
  { name: 'Juegos de Escape Bilbao', slug: 'juegos-escape-bilbao', community: ['País Vasco'] },
  { name: 'Escape Room Sevilla', slug: 'escape-room-sevilla', community: ['Murcia', 'Región de Murcia'] },
  { name: 'Room Escape Canarias', slug: 'room-escape-canarias', community: ['Canarias', 'Islas Canarias'] },
];

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
}

function parseDuration(d: string): number {
  const m = (d || '').match(/(\d+)/);
  return m ? parseInt(m[1]) : 60;
}

function parseDifficulty(d: string): number {
  const n = parseInt(d || '3');
  return isNaN(n) ? 3 : Math.min(5, Math.max(1, n));
}

function parsePrice(p: string): number {
  const n = parseFloat((p || '').replace(',', '.'));
  return isNaN(n) ? 15 : n;
}

function extractCity(locality: string, address: string): string {
  if (locality) return locality.split(',')[0].trim();
  if (address) {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'España';
  }
  return 'España';
}

function extractProvince(community: string): string {
  const map: Record<string, string> = {
    'Comunidad de Madrid': 'Madrid',
    'Madrid': 'Madrid',
    'Cataluña': 'Barcelona',
    'Catañuña': 'Barcelona',
    'Comunidad Valenciana': 'Valencia',
    'Andalucía': 'Sevilla',
    'Sevilla': 'Sevilla',
    'País Vasco': 'Vizcaya',
    'Murcia': 'Murcia',
    'Región de Murcia': 'Murcia',
    'Canarias': 'Las Palmas',
    'Islas Canarias': 'Las Palmas',
  };
  return map[community] || community || '';
}

async function seed() {
  console.log('📦 Loading almacen data...');
  const raw = readFileSync(join(__dirname, '../../../master/backup_games.json'), 'utf-8');
  const allRooms: AlmacenRoom[] = JSON.parse(raw);
  console.log(`   Found ${allRooms.length} rooms in almacen`);

  // Filter rooms with valid data
  const validRooms = allRooms.filter(r =>
    r.name && r.latitude && r.longitude && r.image_url && r.community
  );
  console.log(`   ${validRooms.length} have valid image + coordinates`);

  // Get system admin user as owner for organizations
  const adminResult = await pool.query(`SELECT id FROM users WHERE email = 'admin@dixai.net' LIMIT 1`);
  const ownerId = adminResult.rows[0]?.id;
  if (!ownerId) throw new Error('No admin user found — create one first');
  console.log(`   Using admin user ${ownerId} as org owner`);

  // 1. Create organizations
  console.log('\n🏢 Creating organizations...');
  const orgIds: Record<string, string> = {};

  for (const org of ORGS) {
    const result = await pool.query(
      `INSERT INTO organizations (name, slug, owner_id, is_active, subscription_status, subscription_plan, tier_level)
       VALUES ($1, $2, $3, true, 'active', 'standard', 'standard')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [org.name, org.slug, ownerId]
    );
    orgIds[org.slug] = result.rows[0].id;
    console.log(`   ✅ ${org.name} → ${result.rows[0].id}`);
  }

  // 2. Insert rooms (7-8 per org, ~50 total)
  console.log('\n🚪 Inserting rooms...');
  let roomCount = 0;
  const insertedRoomIds: string[] = [];

  for (const org of ORGS) {
    const orgRooms = validRooms
      .filter(r => org.community.includes(r.community))
      .slice(0, 8);

    for (const room of orgRooms) {
      try {
        const desc = stripHtml(room.description);
        const themes = Array.isArray(room.themes)
          ? room.themes.map((t: any) => t.name || t).filter(Boolean)
          : [];

        const result = await pool.query(
          `INSERT INTO rooms (
            name, description, organization_id, capacity_min, capacity,
            duration_minutes, difficulty_level, price_per_person,
            image_url, is_active, city, province, community,
            address, latitude, longitude, slogan,
            with_actors, themes, baul_game_id,
            average_rating, total_reviews, verification_status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12,
            $13, $14, $15, $16, $17, $18, $19, $20, $21, 'verified'
          )
          ON CONFLICT DO NOTHING
          RETURNING id`,
          [
            room.name,
            desc,
            orgIds[org.slug],
            parseInt(room.min_people) || 2,
            parseInt(room.max_people) || 6,
            parseDuration(room.duration),
            parseDifficulty(room.difficulty),
            parsePrice(room.price_eur),
            room.image_url,
            extractCity(room.locality, room.address),
            extractProvince(room.community),
            room.community,
            room.address || '',
            room.latitude,
            room.longitude,
            (room.slogan || '').substring(0, 500),
            room.with_actors === 1 || room.with_actors === '1',
            `{${themes.map((t: string) => `"${t.replace(/"/g, '')}"` ).join(',')}}`,
            room.id,
            parseFloat(room.google_rating || '') || (3.5 + Math.random() * 1.5),
            Math.floor(Math.random() * 80) + 5,
          ]
        );
        if (result.rows[0]) {
          insertedRoomIds.push(result.rows[0].id);
          roomCount++;
        }
      } catch (err: any) {
        console.warn(`   ⚠️ Skip "${room.name}": ${err.message.substring(0, 80)}`);
      }
    }
    console.log(`   ✅ ${org.name}: ${orgRooms.length} rooms`);
  }
  console.log(`   Total: ${roomCount} rooms inserted`);

  // 3. Create curated collections (routes)
  console.log('\n🗺️ Creating routes...');

  // Get rooms by theme/location for routes
  const allInserted = await pool.query(
    `SELECT id, name, community, difficulty_level, average_rating, themes
     FROM rooms WHERE is_active = true ORDER BY average_rating DESC NULLS LAST`
  );
  const dbRooms = allInserted.rows;

  const routes = [
    {
      title: 'Terror en Madrid',
      slug: 'terror-en-madrid',
      description: 'Las salas más terroríficas de la capital. Solo para valientes.',
      theme_color: '#1a1a2e',
      filter: (r: any) => (r.community === 'Comunidad de Madrid' || r.community === 'Madrid'),
    },
    {
      title: 'Aventura en Barcelona',
      slug: 'aventura-en-barcelona',
      description: 'Descubre las mejores experiencias de aventura en la Ciudad Condal.',
      theme_color: '#0097b2',
      filter: (r: any) => (r.community === 'Cataluña' || r.community === 'Catañuña'),
    },
    {
      title: 'Ruta Familiar',
      slug: 'ruta-familiar',
      description: 'Salas aptas para todas las edades. Diversión garantizada en familia.',
      theme_color: '#f39c12',
      filter: (r: any) => r.difficulty_level <= 2,
    },
    {
      title: 'Top Valoradas España',
      slug: 'top-valoradas-espana',
      description: 'Las salas con mejor puntuación de toda la plataforma.',
      theme_color: '#00849c',
      filter: (_: any) => true, // takes top rated
    },
  ];

  for (const route of routes) {
    const routeResult = await pool.query(
      `INSERT INTO curated_collections (slug, title, description, is_featured, is_active, display_order, theme_color)
       VALUES ($1, $2, $3, true, true, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
       RETURNING id`,
      [route.slug, route.title, route.description, routes.indexOf(route) + 1, route.theme_color]
    );
    const collectionId = routeResult.rows[0].id;

    const routeRooms = dbRooms.filter(route.filter).slice(0, 5);
    for (let i = 0; i < routeRooms.length; i++) {
      await pool.query(
        `INSERT INTO collection_rooms (collection_id, room_id, display_order)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [collectionId, routeRooms[i].id, i + 1]
      );
    }
    console.log(`   ✅ "${route.title}" → ${routeRooms.length} rooms`);
  }

  // 4. Create teams
  console.log('\n👥 Creating teams...');
  const playerResult = await pool.query(`SELECT id FROM players LIMIT 1`);
  const playerId = playerResult.rows[0]?.id;
  if (!playerId) { console.log('   ⚠️ No players found — skipping teams'); await pool.end(); return; }

  const teams = [
    { name: 'Los Escapistas', slug: 'los-escapistas', motto: '¡No hay cerradura que nos detenga!', total_games: 12, total_escapes: 9, win_rate: 75.0 },
    { name: 'Enigma Squad', slug: 'enigma-squad', motto: 'Cada enigma es una oportunidad', total_games: 8, total_escapes: 5, win_rate: 62.5 },
  ];

  for (const team of teams) {
    await pool.query(
      `INSERT INTO squads (name, slug, motto, total_games, total_escapes, win_rate, is_public, leader_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $7)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, motto = EXCLUDED.motto
       RETURNING id`,
      [team.name, team.slug, team.motto, team.total_games, team.total_escapes, team.win_rate, playerId]
    );
    console.log(`   ✅ "${team.name}"`);
  }

  console.log('\n✨ Seed complete!');
  console.log(`   Organizations: ${ORGS.length}`);
  console.log(`   Rooms: ${roomCount}`);
  console.log(`   Routes: ${routes.length}`);
  console.log(`   Teams: ${teams.length}`);

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
