// Main application orchestration

let dataLoader = null;
let renderer = null;
let sidebar = null;
let imageUpload = null;
let exporter = null;

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Debug: Check if Cytoscape and plugins loaded
    if (typeof cytoscape === 'undefined') {
      throw new Error('Cytoscape.js failed to load from CDN');
    }
    console.log('✓ Cytoscape.js loaded');

    // Initialize data loader
    dataLoader = new DataLoader();

    // Load example data (or relationships.json if it exists)
    let data;
    try {
      data = await dataLoader.loadData(CONFIG.dataFilePath);
    } catch (error) {
      // Fallback to example data
      console.log('Loading example data...');
      data = await dataLoader.loadData(CONFIG.exampleDataPath);
    }

    // Transform data to Cytoscape format
    const elements = dataLoader.transformToCytoscapeFormat(data);
    const relTypeMap = dataLoader.getRelationshipTypeMap(data);
    const groupMap = dataLoader.getGroupMap(data);

    // Initialize chart renderer
    renderer = new ChartRenderer('#cy', elements, relTypeMap, groupMap);
    const cy = renderer.initialize();

    // Initialize sidebar
    sidebar = new Sidebar(renderer, data);
    sidebar.initialize();

    // Initialize image upload
    imageUpload = new ImageUpload(renderer, sidebar);
    imageUpload.initialize();

    // Initialize exporter
    exporter = new Exporter(cy);

    // Fit graph to viewport
    renderer.fitToViewport();

    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorBanner(error.message);
  }
}

/**
 * Show error in banner
 */
function showErrorBanner(message) {
  const banner = document.getElementById('errorBanner');
  banner.textContent = `⚠️ ${message}`;
  banner.style.display = 'block';
  console.error(message);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
