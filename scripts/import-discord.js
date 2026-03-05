#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const API_BASE = 'https://discord.com/api/v10';

/**
 * Fetch guild info to get the server name
 */
async function fetchGuildInfo() {
  if (!DISCORD_TOKEN || !GUILD_ID) {
    throw new Error('DISCORD_TOKEN and GUILD_ID must be set in .env file');
  }

  const response = await fetch(`${API_BASE}/guilds/${GUILD_ID}`, {
    headers: {
      Authorization: `Bot ${DISCORD_TOKEN}`,
      'User-Agent': 'DynamicRelationshipChart/1.0'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord API error ${response.status}: ${error}`);
  }

  const guild = await response.json();
  return guild;
}

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
 * Get avatar URL from Discord member (user profile, not server profile)
 */
function getAvatarUrl(member) {
  const userId = member.user.id;
  const avatarHash = member.user.avatar;

  if (!avatarHash) {
    // Default Discord avatar based on discriminator
    const discriminator = member.user.discriminator || '0';
    const index = parseInt(discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=256`;
}

/**
 * Transform Discord members to people array (use user profile, not server profile)
 */
function transformMembers(members) {
  return members
    .filter(m => !m.user.bot) // Exclude bots
    .map(m => ({
      id: m.user.id,
      name: m.user.username,
      image: getAvatarUrl(m),
      group: 'discord',
      bio: ''
    }));
}

/**
 * Merge with existing data
 */
function mergeWithExisting(people, dataFile, guildName) {
  try {
    const existing = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

    // Keep existing relationships
    const existingIds = new Set(existing.people.map(p => p.id));
    const newPeople = people.filter(p => !existingIds.has(p.id));

    return {
      ...existing,
      people: [...existing.people, ...newPeople]
    };
  } catch (error) {
    // File doesn't exist or is invalid, create new
    console.log(`Creating new ${path.basename(dataFile)}...`);
    return {
      metadata: { title: guildName },
      people,
      relationships: [],
      relationshipTypes: [
        { type: 'Cousins', color: '#9b59b6', width: 2 },
        { type: 'Siblings', color: '#3498db', width: 2 },
        { type: 'Friends', color: '#f39c12', width: 1 },
        { type: 'Dating', color: '#e91e63', width: 2 },
        { type: 'Married', color: '#e74c3c', width: 3 },
        { type: 'Subordinate', color: '#2ecc71', width: 2 },
        { type: 'Coworker', color: '#00bcd4', width: 1 }
      ],
      groups: [
        { id: 'discord', label: 'Discord', nodeColor: '#dae8fc' }
      ]
    };
  }
}

/**
 * Sanitize guild name for filename
 */
function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Main import function
 */
async function main() {
  try {
    console.log('🔄 Fetching Discord guild info...');
    const guild = await fetchGuildInfo();
    console.log(`✓ Guild: ${guild.name}`);

    const sanitizedName = sanitizeFilename(guild.name);
    const dataFile = path.join(__dirname, '..', 'data', `${sanitizedName}.json`);

    console.log('🔄 Fetching Discord guild members...');
    const members = await fetchGuildMembers();
    console.log(`✓ Fetched ${members.length} members`);

    console.log('🔄 Transforming data...');
    const people = transformMembers(members);
    console.log(`✓ ${people.length} members (bots excluded)`);

    console.log('🔄 Merging with existing data...');
    const data = mergeWithExisting(people, dataFile, guild.name);

    console.log(`🔄 Writing ${path.basename(dataFile)}...`);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`✓ Saved to ${dataFile}`);

    console.log('\n✅ Import complete!');
    console.log('Next steps:');
    console.log('  1. Open index.html in a browser');
    console.log('  2. Use "npx serve ." to run a local server');
    console.log('  3. Load your guild data via the "Load Data" section');
    console.log('  4. Add relationships manually in the sidebar');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
