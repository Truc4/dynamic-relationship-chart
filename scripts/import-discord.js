#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const DATA_FILE = path.join(__dirname, '..', 'data', 'relationships.json');
const API_BASE = 'https://discord.com/api/v10';

/**
 * Fetch all members from a Discord guild
 */
async function fetchGuildMembers() {
  if (!DISCORD_TOKEN || !GUILD_ID) {
    throw new Error('DISCORD_TOKEN and GUILD_ID must be set in .env file');
  }

  const members = [];
  let after = null;

  while (true) {
    const url = new URL(`${API_BASE}/guilds/${GUILD_ID}/members`);
    url.searchParams.set('limit', '1000');
    if (after) {
      url.searchParams.set('after', after);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
        'User-Agent': 'DynamicRelationshipChart/1.0'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error ${response.status}: ${error}`);
    }

    const batch = await response.json();
    if (batch.length === 0) break;

    members.push(...batch);
    after = batch[batch.length - 1].user.id;

    console.log(`Fetched ${members.length} members so far...`);
  }

  return members;
}

/**
 * Get avatar URL from Discord member
 */
function getAvatarUrl(member) {
  const userId = member.user.id;
  const avatarHash = member.avatar || member.user.avatar;

  if (!avatarHash) {
    // Default Discord avatar based on discriminator
    const discriminator = member.user.discriminator || '0';
    const index = parseInt(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`;
}

/**
 * Transform Discord members to people array
 */
function transformMembers(members) {
  return members
    .filter(m => !m.user.bot) // Exclude bots
    .map(m => ({
      id: m.user.id,
      name: m.nick || m.user.username,
      image: getAvatarUrl(m),
      group: 'discord',
      bio: ''
    }));
}

/**
 * Merge with existing data
 */
function mergeWithExisting(people) {
  try {
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    // Keep existing relationships
    const existingIds = new Set(existing.people.map(p => p.id));
    const newPeople = people.filter(p => !existingIds.has(p.id));

    return {
      ...existing,
      people: [...existing.people, ...newPeople]
    };
  } catch (error) {
    // File doesn't exist or is invalid, create new
    console.log('Creating new relationships.json...');
    return {
      metadata: { title: 'Discord Guild Network' },
      people,
      relationships: [],
      relationshipTypes: [
        { type: 'Married', color: '#e74c3c', width: 3 },
        { type: 'Siblings', color: '#3498db', width: 2 },
        { type: 'Cousins', color: '#9b59b6', width: 2 },
        { type: 'ParentChild', color: '#2ecc71', width: 2 },
        { type: 'Friends', color: '#f39c12', width: 1 }
      ],
      groups: [
        { id: 'discord', label: 'Discord', nodeColor: '#dae8fc' }
      ]
    };
  }
}

/**
 * Main import function
 */
async function main() {
  try {
    console.log('🔄 Fetching Discord guild members...');
    const members = await fetchGuildMembers();
    console.log(`✓ Fetched ${members.length} members`);

    console.log('🔄 Transforming data...');
    const people = transformMembers(members);
    console.log(`✓ ${people.length} members (bots excluded)`);

    console.log('🔄 Merging with existing data...');
    const data = mergeWithExisting(people);

    console.log('🔄 Writing relationships.json...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`✓ Saved to ${DATA_FILE}`);

    console.log('\n✅ Import complete!');
    console.log('Next steps:');
    console.log('  1. Open index.html in a browser');
    console.log('  2. Use "npx serve ." to run a local server');
    console.log('  3. Add relationships manually in the sidebar or edit relationships.json');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
