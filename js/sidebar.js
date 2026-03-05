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

    // Relationship form
    this.populateRelationshipForm();

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

    // Download JSON
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    downloadJsonBtn.addEventListener('click', () => this.downloadJSON());

    // Add relationship
    const addRelationshipBtn = document.getElementById('addRelationshipBtn');
    addRelationshipBtn.addEventListener('click', () => this.addRelationship());

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
   * Populate relationship form dropdowns
   */
  populateRelationshipForm() {
    const sourceSelect = document.getElementById('relSourceSelect');
    const targetSelect = document.getElementById('relTargetSelect');
    const typeSelect = document.getElementById('relTypeSelect');

    // Clear existing options
    sourceSelect.innerHTML = '<option value="">-- Select source --</option>';
    targetSelect.innerHTML = '<option value="">-- Select target --</option>';
    typeSelect.innerHTML = '<option value="">-- Select type --</option>';

    // Sort people by name
    const sortedPeople = [...this.data.people].sort((a, b) => a.name.localeCompare(b.name));

    // Populate source and target with people
    sortedPeople.forEach(person => {
      const sourceOpt = document.createElement('option');
      sourceOpt.value = person.id;
      sourceOpt.textContent = person.name;
      sourceSelect.appendChild(sourceOpt);

      const targetOpt = document.createElement('option');
      targetOpt.value = person.id;
      targetOpt.textContent = person.name;
      targetSelect.appendChild(targetOpt);
    });

    // Populate type dropdown
    this.data.relationshipTypes.forEach(relType => {
      const opt = document.createElement('option');
      opt.value = relType.type;
      opt.textContent = relType.type;
      typeSelect.appendChild(opt);
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

    // Repopulate group filters and relationship form
    this.populateGroupFilters();
    this.populateRelationshipForm();

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
    relationshipsEl.innerHTML = '';

    if (connectedEdges.length > 0) {
      connectedEdges.forEach(edge => {
        const otherNode = edge.source().id() === node.id() ? edge.target() : edge.source();
        const relationshipDiv = document.createElement('div');
        relationshipDiv.className = 'relationship-item';

        const textSpan = document.createElement('span');
        textSpan.textContent = `${edge.data('label')} → ${otherNode.data('label')}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-rel-btn';
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', () => this.deleteRelationship(edge.id(), node));

        relationshipDiv.appendChild(textSpan);
        relationshipDiv.appendChild(deleteBtn);
        relationshipsEl.appendChild(relationshipDiv);
      });
    } else {
      relationshipsEl.innerHTML = '<p style="color: #999; font-size: 12px;">(No relationships)</p>';
    }

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

  /**
   * Add a new relationship from the form
   */
  addRelationship() {
    const source = document.getElementById('relSourceSelect').value;
    const target = document.getElementById('relTargetSelect').value;
    const type = document.getElementById('relTypeSelect').value;
    const label = document.getElementById('relLabelInput').value.trim();

    // Validate inputs
    if (!source || !target || !type) {
      this.showError('Please select source, target, and type');
      return;
    }

    if (source === target) {
      this.showError('Source and target must be different');
      return;
    }

    // Add edge to Cytoscape
    const edgeData = {
      source,
      target,
      relationType: type,
      label: label || type
    };
    this.renderer.cy.add({ data: edgeData });

    // Add to data
    const newRelationship = {
      source,
      target,
      type,
      label: label || undefined
    };
    if (!label) delete newRelationship.label;
    this.data.relationships.push(newRelationship);
    dataLoader.data.relationships.push(newRelationship);

    // Clear form
    document.getElementById('relLabelInput').value = '';

    // Re-run layout
    this.renderer.runLayout();

    this.showSuccess(`Added relationship: ${type}`);
  }

  /**
   * Delete a relationship
   */
  deleteRelationship(edgeId, node) {
    const edge = this.renderer.cy.getElementById(edgeId);
    if (!edge.nonempty()) {
      this.showError('Edge not found');
      return;
    }

    const source = edge.data('source');
    const target = edge.data('target');
    const type = edge.data('relationType');

    // Remove from Cytoscape
    edge.remove();

    // Remove from data
    const idx = this.data.relationships.findIndex(rel =>
      rel.source === source && rel.target === target && rel.type === type
    );
    if (idx >= 0) {
      this.data.relationships.splice(idx, 1);
      dataLoader.data.relationships.splice(idx, 1);
    }

    // Refresh node info panel
    this.showNodeInfo(node);

    this.showSuccess('Relationship deleted');
  }

  /**
   * Download current data as JSON
   */
  downloadJSON() {
    const json = JSON.stringify(dataLoader.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relationships.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showSuccess('JSON downloaded');
  }
}
