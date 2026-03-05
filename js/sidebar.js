// Sidebar controls and interactions

class Sidebar {
  constructor(renderer, data) {
    this.renderer = renderer;
    this.data = data;
    this.currentSearchTerm = '';
    this.selectedGroups = new Set();
    this.edgeLabelsVisible = true;
    this.selectedNodes = []; // Track selected nodes for creating relationships
    this.currentEditingEdge = null; // Track edge being edited
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

    // Set node click handler
    this.renderer.onNodeClick = (node) => this.handleNodeClick(node);

    // Set edge click handler
    this.renderer.onEdgeClick = (edge) => this.handleEdgeClick(edge);
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
   * Populate relationship form dropdowns (for edge editing)
   */
  populateRelationshipForm() {
    const newRelTypeSelect = document.getElementById('newRelTypeSelect');
    const editEdgeTypeSelect = document.getElementById('editEdgeTypeSelect');

    // Clear and populate type dropdowns
    [newRelTypeSelect, editEdgeTypeSelect].forEach(select => {
      select.innerHTML = '<option value="">-- Select type --</option>';
      this.data.relationshipTypes.forEach(relType => {
        const opt = document.createElement('option');
        opt.value = relType.type;
        opt.textContent = relType.type;
        select.appendChild(opt);
      });
    });

    // Setup event listeners
    document.getElementById('createRelationshipBtn').addEventListener('click', () => this.createRelationship());
    document.getElementById('cancelSelectionBtn').addEventListener('click', () => this.clearNodeSelection());
    document.getElementById('saveEdgeBtn').addEventListener('click', () => this.saveEdgeEdit());
    document.getElementById('deleteEdgeBtn').addEventListener('click', () => this.deleteEdgeFromEdit());
    document.getElementById('closeEdgeEditBtn').addEventListener('click', () => this.closeEdgeEdit());
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
   * Handle node click - for selecting nodes to create relationships
   */
  handleNodeClick(node) {
    const nodeId = node.id();
    const nodeIndex = this.selectedNodes.findIndex(n => n.id() === nodeId);

    if (nodeIndex >= 0) {
      // Deselect if already selected
      this.selectedNodes.splice(nodeIndex, 1);
      node.unselect();
    } else {
      // Select node (allow max 2)
      if (this.selectedNodes.length < 2) {
        this.selectedNodes.push(node);
        node.select();
      } else {
        // Replace the oldest selection
        this.selectedNodes[0].unselect();
        this.selectedNodes[0] = node;
        node.select();
      }
    }

    this.updateNodeSelectionDisplay();
    this.showNodeInfo(node);
  }

  /**
   * Handle edge click - for editing relationships
   */
  handleEdgeClick(edge) {
    this.currentEditingEdge = edge;
    this.showEdgeEdit(edge);
  }

  /**
   * Update the node selection display
   */
  updateNodeSelectionDisplay() {
    const panel = document.getElementById('nodeSelectionPanel');
    const display = document.getElementById('selectedNodesDisplay');
    const relTypePanel = document.getElementById('relTypeSelectionPanel');

    if (this.selectedNodes.length === 0) {
      panel.style.display = 'none';
      return;
    }

    panel.style.display = 'block';

    const nodeNames = this.selectedNodes.map(n => n.data('label')).join(' → ');
    display.textContent = nodeNames;

    if (this.selectedNodes.length === 2) {
      relTypePanel.style.display = 'block';
    } else {
      relTypePanel.style.display = 'none';
    }
  }

  /**
   * Clear node selection
   */
  clearNodeSelection() {
    this.selectedNodes.forEach(n => n.unselect());
    this.selectedNodes = [];
    document.getElementById('nodeSelectionPanel').style.display = 'none';
    document.getElementById('newRelLabelInput').value = '';
    document.getElementById('newRelTypeSelect').value = '';
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

        const editBtn = document.createElement('button');
        editBtn.className = 'delete-rel-btn';
        editBtn.textContent = '✎';
        editBtn.title = 'Edit relationship';
        editBtn.addEventListener('click', () => this.handleEdgeClick(edge));

        relationshipDiv.appendChild(textSpan);
        relationshipDiv.appendChild(editBtn);
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
   * Create a new relationship from selected nodes
   */
  createRelationship() {
    if (this.selectedNodes.length !== 2) {
      this.showError('Please select exactly 2 nodes');
      return;
    }

    const type = document.getElementById('newRelTypeSelect').value;
    const label = document.getElementById('newRelLabelInput').value.trim();

    if (!type) {
      this.showError('Please select a relationship type');
      return;
    }

    const source = this.selectedNodes[0].id();
    const target = this.selectedNodes[1].id();

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

    // Clear selection
    this.clearNodeSelection();

    // Re-run layout
    this.renderer.runLayout();

    this.showSuccess(`Added relationship: ${type}`);
  }

  /**
   * Show edge edit panel
   */
  showEdgeEdit(edge) {
    const panel = document.getElementById('edgeEditPanel');
    const infoDisplay = document.getElementById('edgeInfoDisplay');
    const typeSelect = document.getElementById('editEdgeTypeSelect');
    const labelInput = document.getElementById('editEdgeLabelInput');

    const source = edge.source().data('label');
    const target = edge.target().data('label');
    const currentType = edge.data('relationType');
    const currentLabel = edge.data('label');

    infoDisplay.textContent = `${source} → ${target}`;
    typeSelect.value = currentType;
    labelInput.value = currentLabel && currentLabel !== currentType ? currentLabel : '';

    // Hide other panels
    document.getElementById('nodeSelectionPanel').style.display = 'none';

    panel.style.display = 'block';
  }

  /**
   * Close edge edit panel
   */
  closeEdgeEdit() {
    document.getElementById('edgeEditPanel').style.display = 'none';
    this.currentEditingEdge = null;
  }

  /**
   * Save edge edit
   */
  saveEdgeEdit() {
    if (!this.currentEditingEdge) return;

    const type = document.getElementById('editEdgeTypeSelect').value;
    const label = document.getElementById('editEdgeLabelInput').value.trim();

    if (!type) {
      this.showError('Please select a type');
      return;
    }

    const edge = this.currentEditingEdge;
    const oldType = edge.data('relationType');
    const source = edge.data('source');
    const target = edge.data('target');

    // Update edge data
    edge.data('relationType', type);
    edge.data('label', label || type);

    // Update in data array
    const idx = this.data.relationships.findIndex(rel =>
      rel.source === source && rel.target === target && rel.type === oldType
    );
    if (idx >= 0) {
      this.data.relationships[idx].type = type;
      this.data.relationships[idx].label = label || undefined;
      if (!label) delete this.data.relationships[idx].label;
      dataLoader.data.relationships[idx] = this.data.relationships[idx];
    }

    this.closeEdgeEdit();
    this.renderer.runLayout();
    this.showSuccess('Relationship updated');
  }

  /**
   * Delete edge from edit panel
   */
  deleteEdgeFromEdit() {
    if (!this.currentEditingEdge) return;

    const edge = this.currentEditingEdge;
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

    this.closeEdgeEdit();
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
