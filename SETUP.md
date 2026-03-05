# Setup Instructions

## Immediate Start (60 seconds)

1. **Start a local server:**
   ```bash
   npx serve .
   ```
   Then open http://localhost:3000 in your browser.

   **Alternative options:**
   - VS Code: Install "Live Server" extension, right-click `index.html` → "Open with Live Server"
   - Python: `python -m http.server 8000` then open http://localhost:8000

2. **You should see:**
   - A graph with 9 people (Alice, Bob, Carol, etc.)
   - Nodes connected by colored edges (Married, Friends, Siblings, etc.)
   - A sidebar with controls (Search, Groups, Layout, Export, Images)

## Customize Your Data

1. **Edit `data/relationships.json`** with your own people and relationships
   - Copy the structure from `relationships.example.json`
   - Use person `id` and `name` fields
   - Create relationships by `source`, `target`, and `type`

2. **Reload data:**
   - Edit the file while the app is running
   - Click **Reload** in the sidebar → Load Data section
   - Graph updates without page refresh

## Add Photos

### Option 1: Bulk Upload
1. Prepare images with filenames matching person IDs:
   - `alice.jpg`, `bob.jpg`, etc.
2. Click **Upload Images** in sidebar
3. Select all images at once
4. Images auto-match by filename stem

### Option 2: Drag-to-Node
1. Drag an image file directly onto a person node
2. Image is assigned immediately

### Option 3: Edit JSON
1. Add image paths directly in `relationships.json`:
   ```json
   { "id": "alice", "name": "Alice", "image": "images/alice.jpg" }
   ```
2. Reload data

## Export Your Graph

1. Adjust layout with sliders if needed (Node Spacing, Edge Length)
2. Click **Export PNG** or **Export JPEG**
3. Download saves to your Downloads folder

**Tips:**
- Check **Transparent Background** for PNG export with no white background
- 2x resolution = print-quality
- Uncheck **Show Edge Labels** for cleaner exports

## (Optional) Discord Guild Importer

If you want to populate people from a Discord server:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Discord bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - New Application → Create Bot
   - Enable **Server Members Intent**
   - Copy bot token

3. **Add bot to your server:**
   - OAuth2 → URL Generator
   - Scopes: `bot`
   - Permissions: `Read Members`
   - Open generated URL, authorize

4. **Configure:**
   ```bash
   cp scripts/.env.example scripts/.env
   # Edit .env with your bot token and server ID
   ```

   To get Server ID:
   - Enable Developer Mode in Discord (User Settings → Advanced)
   - Right-click server name → Copy Server ID

5. **Run import:**
   ```bash
   npm run import-discord
   ```

   This fetches all members and writes to `data/relationships.json`.

## Keyboard & Mouse Controls

- **Pan**: Click and drag canvas
- **Zoom**: Scroll wheel
- **Select node**: Click node (shows info in sidebar)
- **Search**: Type in Search box (dims non-matches)
- **Filter groups**: Toggle checkboxes in Groups section
- **Relayout**: Adjust sliders or click Re-run Layout button

## Troubleshooting

**"Failed to load" error?**
- Are you using a local server? (not `file://` in browser address bar)
- Check browser DevTools console (F12) for details

**Images not showing?**
- Local paths: use relative paths from `index.html`
  - ✓ `images/alice.jpg`
  - ✓ `./data/images/alice.jpg`
  - ✗ `/home/user/alice.jpg`
- External URLs: must be HTTPS with CORS enabled
  - ✓ `https://example.com/alice.jpg`
- Uploaded images: drop on nodes or use bulk upload

**Missing placeholder?**
- Make sure `images/placeholder.svg` exists
- Used when person has no image

**Export shows blank images?**
- External images with strict CORS headers may not render in export
- Use uploaded/data-URL images or placeholder SVGs (always work)

## Project Files

See `README.md` for full documentation and API reference.

## Next Steps

1. Add your people to `relationships.json`
2. Add photos (upload or edit JSON)
3. Create relationships
4. Share or export your graph!

Questions? See `README.md` for detailed guides on each feature.
