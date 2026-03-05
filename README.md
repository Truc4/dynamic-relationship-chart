# Dynamic Relationship Chart

An interactive web app for visualizing people and their relationships in a force-directed graph.

## Features

- **Interactive Graph**: Cytoscape.js-powered visualization with drag-to-pan and zoom
- **Node Images**: Display photos of people (or placeholder silhouettes)
- **Relationship Types**: Color-coded edges for different types of relationships (Married, Friends, Siblings, etc.)
- **Search & Filter**: Find people, filter by group
- **Layout Control**: Adjust node spacing and edge length in real-time
- **Export**: Download graph as PNG or JPEG (2x resolution)
- **Bulk Image Upload**: Upload multiple images and auto-match to people by filename
- **Drag-to-Node Images**: Drop images directly onto nodes to assign them
- **Optional Discord Import**: Populate people from a Discord server (requires bot token)

## Quick Start

### 1. Run a Local Server

The app requires a local HTTP server due to CORS restrictions on `file://` URLs.

**Option A: Use VS Code Live Server**
- Install the "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Option B: Use `npx serve`**
```bash
npx serve .
```

**Option C: Use Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### 2. Load Your Data

The app loads from `data/relationships.json` by default. If that file is empty, it falls back to `data/relationships.example.json` (the demo data).

You can also upload a JSON file via the sidebar's **Load Data** section without reloading the page.

### 3. JSON Data Schema

Edit `data/relationships.json` to define your network:

```json
{
  "metadata": { "title": "My Family Network" },
  "people": [
    { "id": "alice", "name": "Alice Smith", "image": "images/alice.jpg", "group": "family", "bio": "..." }
  ],
  "relationships": [
    { "source": "alice", "target": "bob", "type": "Married", "label": "Married 2010" }
  ],
  "relationshipTypes": [
    { "type": "Married", "color": "#e74c3c", "width": 3 }
  ],
  "groups": [
    { "id": "family", "label": "Family", "nodeColor": "#d5e8d4" }
  ]
}
```

**Key fields:**
- `people[].id`: Unique identifier (no spaces) — used in relationships
- `people[].image`: Path (relative to `index.html`) or full HTTPS URL; empty string uses placeholder
- `relationships[].label`: Optional text on the edge
- Nodes are colored by group; edges by relationship type

## Sidebar Controls

### Search
- Filter nodes by name (dims non-matching nodes/edges)

### Groups
- Auto-generated checkboxes from your JSON
- Toggle groups on/off to show/hide people

### Layout
- **Re-run Layout**: Re-execute the COSE force-directed layout
- **Node Spacing**: Slider to adjust repulsion (400k–600k)
- **Edge Length**: Slider for ideal edge length (50–300px)
- **Show Edge Labels**: Toggle relationship labels on edges

### Export
- **Transparent Background**: Export with transparent background (PNG only) or white (PNG/JPEG)
- **Export PNG**: Download as PNG (2x resolution, full graph)
- **Export JPEG**: Download as JPEG (2x resolution, full graph)

### Images
- **Upload Images**: Bulk upload images; filename stem matched to person `id`
  - E.g., `alice.jpg` → `id: "alice"`
  - Fallback: `alice-smith.jpg` → `name: "Alice Smith"` (lowercased stem match)
- **Drag Images**: Drag image files directly onto nodes in the graph

### Node Info Panel
- Click a node to see: name, image, bio, connected relationships

## Image Upload

### Bulk Upload
1. Click **Upload Images** and select multiple image files
2. Filenames are matched to person IDs (case-insensitive):
   - `alice.jpg` → node `id: "alice"`
   - `alice-smith.jpg` → matches node with lowercased label "alice smith"
3. Unmatched images show a warning

### Drag-to-Node
1. Drag an image file onto a person node in the graph
2. Image is assigned to that node immediately

### Image Paths
- **Uploaded images**: Stored as `data://` URLs in memory (not saved to disk)
- **File paths**: Use relative paths (e.g., `images/alice.jpg`)
- **URLs**: Use full HTTPS URLs (e.g., `https://example.com/alice.jpg`)

**Note**: External images with restrictive CORS headers may not appear in PNG exports.

## Optional: Discord Guild Importer

Populate your people list from a Discord server automatically.

### Setup

1. **Create a Discord Bot** (one-time)
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application"
   - Create a bot user
   - Copy the bot token

2. **Enable Server Members Intent**
   - In the Developer Portal, go to the bot's "Bot" page
   - Enable the **Server Members Intent** (required)

3. **Add Bot to Your Server**
   - Go to OAuth2 → URL Generator
   - Select scopes: `bot`
   - Select permissions: `Read Members`
   - Copy the generated URL and open it in your browser

4. **Configure the Script**
   ```bash
   cp scripts/.env.example scripts/.env
   # Edit scripts/.env with your bot token and guild ID
   ```

   To get your Guild ID:
   - Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
   - Right-click your server name and "Copy Server ID"

5. **Run the Import**
   ```bash
   npm install
   npm run import-discord
   ```

   This fetches all guild members and writes them to `data/relationships.json`. Existing relationships are preserved.

### How It Works
- Fetches members from the Discord API (paginated for large servers)
- Skips bots
- Uses Discord avatar URLs for images (public, no CORS issues)
- Merges with existing `relationships.json` (preserves your manual relationships)

## Project Structure

```
dynamic-relationship-chart/
  index.html                   # Page shell
  css/style.css                # Layout, controls
  js/
    config.js                  # Constants
    dataLoader.js              # Load & validate JSON
    chartRenderer.js           # Cytoscape init & styles
    sidebar.js                 # Controls, node info panel
    exporter.js                # PNG/JPEG export
    imageUpload.js             # Bulk upload, drag-to-node
    app.js                     # Main orchestrator
  data/
    relationships.json         # Your data
    relationships.example.json # Demo with 9 people
  images/
    placeholder.svg            # Fallback silhouette
  scripts/
    import-discord.js          # Optional guild importer
    .env.example               # Discord bot config template
  package.json                 # Node deps (for Discord import)
```

## Troubleshooting

### "Failed to load data/relationships.json"
- Make sure you're running a local server (`npx serve .`, Live Server, etc.)
- Check browser DevTools console for more details
- The app will fall back to example data if `relationships.json` is empty

### Images not showing
- **Local paths**: Use relative paths from `index.html`, e.g., `images/alice.jpg`
- **External URLs**: Use full HTTPS URLs
- **Uploaded images**: Drop on nodes or use bulk upload; data is stored in memory
- **No image = placeholder**: Empty string in `people[].image` shows the default silhouette

### PNG export shows blank images
- External images with restrictive CORS headers may not render in exports
- Uploaded/data URL images always work
- Placeholder SVGs always work

### Discord import fails
- Check your `.env` file has `DISCORD_TOKEN` and `GUILD_ID`
- Verify the bot token is valid and has Server Members intent enabled
- Bot must be in the server with proper permissions
- Check browser console / terminal for detailed error messages

## Tips

- **Large networks**: Adjust "Node Spacing" and "Edge Length" to prevent overcrowding
- **Organize by group**: Use the `group` field to categorize people (Family, Friends, etc.)
- **Relationship labels**: Add context with the `label` field (e.g., "Married 2010")
- **Hide groups**: Use Group filter to focus on subsets of your network
- **Fast iteration**: Edit `relationships.json` and reload via the sidebar without refreshing the page

## License

MIT
