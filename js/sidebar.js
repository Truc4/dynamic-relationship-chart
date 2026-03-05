// Sidebar controls and interactions

class Sidebar {
  constructor(renderer, data) {
    this.renderer = renderer;
    this.data = data;
    this.currentSearchTerm = '';
    this.selectedGroups = new Set();
    this.edgeLabelsVisible = true;
  }

  /**
   * Initialize sidebar controls
   */
  initialize() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => this.onSearch(e.target.value));

    // Group filter
    this.populateGroupFilters();

    // Layout controls
    const relayoutBtn = document.getElementById('relayoutBtn');
    relayoutBtn.addEventListener('click', () => this.onRelayout());

    const nodeRepulsionSlider = document.getElementById('nodeRepulsionSlider');
    nodeRepulsionSlider.addEventListener('input', (e) => this.onLayoutParamChange());

    const edgeLengthSlider = document.getElementById('edgeLengthSlider');
    edgeLengthSlider.addEventListener('input', (e) => this.onLayoutParamChange());

    // Edge labels toggle
    const edgeLabelsToggle = document.getElementById('edgeLabelsToggle');
    edgeLabelsToggle.addEventListener('change', (e) => this.onEdgeLabelsToggle(e.target.checked));

    // Export buttons
    const exportPngBtn = document.getElementById('exportPngBtn');
    exportPngBtn.addEventListener('click', () => this.onExportPNG());

    const exportJpgBtn = document.getElementById('exportJpgBtn');
    exportJpgBtn.addEventListener('click', () => this.onExportJPEG());

    // Data reload
    const dataFileInput = document.getElementById('dataFileInput');
    dataFileInput.addEventListener('change', (e) => this.onDataFileSelected(e));

    // Set node click handler
    this.renderer.onNodeClick = (node) => this.showNodeInfo(node);
  }

  /**
   * Populate group filter checkboxes
   */
  populateGroupFilters() {
    const container = document.getElementById('groupFilterContainer');
    container.innerHTML = '';

    this.data.groups.forEach(group => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = group.id;
      checkbox.checked = true;
      checkbox.addEventListener('change', () => this.onGroupFilterChange());

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(group.label));
      container.appendChild(label);

      this.selectedGroups.add(group.id);
    });
  }

  /**
   * Search input handler
   */
  onSearch(searchTerm) {
    this.currentSearchTerm = searchTerm;
    this.renderer.applySearchFilter(searchTerm);
  }

  /**
   * Group filter change handler
   */
  onGroupFilterChange() {
    const checkboxes = document.querySelectorAll('#groupFilterContainer input[type="checkbox"]');
    this.selectedGroups.clear();

    checkboxes.forEach(cb => {
      if (cb.checked) {
        this.selectedGroups.add(cb.value);
      }
    });

    if (this.selectedGroups.size === this.data.groups.length) {
      // All groups selected
      this.renderer.applyGroupFilter([]);
    } else {
      this.renderer.applyGroupFilter(Array.from(this.selectedGroups));
    }
  }

  /**
   * Relayout button handler
   */
  onRelayout() {
    this.renderer.runLayout();
  }

  /**
   * Layout parameter change handler
   */
  onLayoutParamChange() {
    const nodeRepulsion = parseInt(document.getElementById('nodeRepulsionSlider').value);
    const edgeLength = parseInt(document.getElementById('edgeLengthSlider').value);
    this.renderer.updateLayoutParams(nodeRepulsion, edgeLength);
  }

  /**
   * Edge labels toggle handler
   */
  onEdgeLabelsToggle(visible) {
    this.edgeLabelsVisible = visible;
    this.renderer.toggleEdgeLabels(visible);
  }

  /**
   * Export PNG handler
   */
  async onExportPNG() {
    try {
      const transparentBg = document.getElementById('transparentBgCheckbox').checked;
      await exporter.exportPNG(transparentBg);
      this.showSuccess('PNG exported successfully');
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Export JPEG handler
   */
  async onExportJPEG() {
    try {
      const transparentBg = document.getElementById('transparentBgCheckbox').checked;
      await exporter.exportJPEG(transparentBg);
      this.showSuccess('JPEG exported successfully');
    } catch (error) {
      this.showError(error.message);
    }
  }

  /**
   * Data file selected handler
   */
  onDataFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const newData = JSON.parse(e.target.result);
        dataLoader.validateData(newData);

        // Update chart with new data without page reload
        this.updateChartWithNewData(newData);
        this.showSuccess(`Loaded ${file.name} (${newData.people.length} people, ${newData.relationships.length} relationships)`);

        // Clear the file input
        event.target.value = '';
      } catch (error) {
        this.showError(`Invalid JSON: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Update chart with new data
   */
  updateChartWithNewData(newData) {
    // Update global data
    this.data = newData;
    dataLoader.data = newData;

    // Transform to Cytoscape format
    const elements = dataLoader.transformToCytoscapeFormat(newData);
    const relTypeMap = dataLoader.getRelationshipTypeMap(newData);
    const groupMap = dataLoader.getGroupMap(newData);

    // Update renderer
    renderer.elements = elements;
    renderer.relTypeMap = relTypeMap;
    renderer.groupMap = groupMap;

    // Clear and rebuild graph
    renderer.cy.elements().remove();
    renderer.cy.add(elements);

    // Recreate styles with new data
    const styles = renderer.buildStyles();
    renderer.cy.style(styles);

    // Repopulate group filters
    this.populateGroupFilters();

    // Run layout
    renderer.runLayout();
    renderer.fitToViewport();
  }

  /**
   * Show node information panel
   */
  showNodeInfo(node) {
    const panel = document.getElementById('nodeInfoPanel');
    const nameEl = document.getElementById('nodeInfoName');
    const imageEl = document.getElementById('nodeInfoImage');
    const bioEl = document.getElementById('nodeInfoBio');
    const relationshipsEl = document.getElementById('nodeInfoRelationships');

    nameEl.textContent = node.data('label');

    const imagePath = node.data('image');
    imageEl.src = imagePath;
    imageEl.style.display = imagePath ? 'block' : 'none';

    bioEl.textContent = node.data('bio') || '(No bio)';

    // Get connected nodes and relationships
    const connectedEdges = node.connectedEdges();
    let relationshipText = '';
    if (connectedEdges.length > 0) {
      const relationships = connectedEdges.map(edge => {
        const otherNode = edge.source().id() === node.id() ? edge.target() : edge.source();
        return `${edge.data('label')} → ${otherNode.data('label')}`;
      }).join('<br>');
      relationshipText = relationships;
    } else {
      relationshipText = '(No relationships)';
    }
    relationshipsEl.innerHTML = relationshipText;

    panel.style.display = 'block';
  }

  /**
   * Show error message
   */
  showError(message) {
    const banner = document.getElementById('errorBanner');
    banner.textContent = `⚠️ ${message}`;
    banner.style.display = 'block';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    const banner = document.getElementById('errorBanner');
    banner.textContent = `✓ ${message}`;
    banner.style.background = '#d4edda';
    banner.style.borderColor = '#c3e6cb';
    banner.style.color = '#155724';
    banner.style.display = 'block';
    setTimeout(() => {
      banner.style.display = 'none';
      banner.style.background = '#f8d7da';
      banner.style.borderColor = '#f5c6cb';
      banner.style.color = '#721c24';
    }, 5000);
  }
}
