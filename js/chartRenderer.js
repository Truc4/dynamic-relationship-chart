// Cytoscape initialization and rendering

class ChartRenderer {
  constructor(containerSelector, elements, relTypeMap, groupMap) {
    this.containerSelector = containerSelector;
    this.elements = elements;
    this.relTypeMap = relTypeMap;
    this.groupMap = groupMap;
    this.cy = null;
    this.currentLayout = null;
  }

  /**
   * Initialize Cytoscape instance
   */
  initialize() {
    const styles = this.buildStyles();

    this.cy = cytoscape({
      container: document.querySelector(this.containerSelector),
      elements: this.elements,
      style: styles,
      layout: {
        name: 'preset' // Start with preset, we'll apply dynamic layout below
      },
      pixelRatio: 1
      // wheelSensitivity: use default (1.0) to avoid warning about non-standard hardware config
    });

    // Add node click handler before running layout
    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      this.onNodeClick(node);
    });

    // Add edge click handler
    this.cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      this.onEdgeClick(edge);
    });

    // Run initial layout (COSE-Bilkent is auto-registered from CDN)
    // Use a small delay to ensure Cytoscape is fully ready
    setTimeout(() => this.runLayout(), 50);

    return this.cy;
  }

  /**
   * Build Cytoscape style definitions
   */
  buildStyles() {
    return [
      {
        selector: 'node',
        style: {
          'background-image': 'data(image)',
          'background-fit': 'cover',
          'background-clip': 'node',
          'shape': 'ellipse',
          'width': CONFIG.nodeSize,
          'height': CONFIG.nodeSize,
          'background-color': (ele) => this.getNodeColor(ele),
          'border-width': 2,
          'border-color': '#333',
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-margin-y': 10,
          'font-size': 12,
          'text-wrap': 'wrap',
          'text-max-width': 100,
          'color': '#000'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#2196F3'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': (ele) => this.getEdgeWidth(ele),
          'line-color': (ele) => this.getEdgeColor(ele),
          'target-arrow-color': (ele) => this.getEdgeColor(ele),
          'target-arrow-shape': 'none',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'text-background-color': '#fff',
          'text-background-padding': '2px',
          'text-background-opacity': 0.8,
          'font-size': 10,
          'text-opacity': (ele) => ele.scratch()._edgeLabelsVisible !== false ? 1 : 0
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#2196F3',
          'target-arrow-color': '#2196F3'
        }
      },
      {
        selector: '.dimmed',
        style: {
          'opacity': 0.2
        }
      }
    ];
  }

  /**
   * Get node background color based on group
   */
  getNodeColor(node) {
    const group = node.data('group');
    const groupInfo = this.groupMap[group];
    return groupInfo ? groupInfo.color : '#e0e0e0';
  }

  /**
   * Get edge color based on relationship type
   */
  getEdgeColor(edge) {
    const relType = edge.data('relationType');
    const typeInfo = this.relTypeMap[relType];
    return typeInfo ? typeInfo.color : CONFIG.defaultRelationshipColor;
  }

  /**
   * Get edge width based on relationship type
   */
  getEdgeWidth(edge) {
    const relType = edge.data('relationType');
    const typeInfo = this.relTypeMap[relType];
    return typeInfo ? typeInfo.width : CONFIG.defaultRelationshipWidth;
  }

  /**
   * Run COSE layout (with fallbacks)
   */
  runLayout(layoutConfig = null) {
    if (!this.cy) return;

    // Stop any currently running layout
    if (this.currentLayout) {
      try {
        this.currentLayout.stop();
      } catch (e) {
        // Layout might already be stopped
      }
    }

    const config = layoutConfig || CONFIG.layout;
    console.log(`Attempting layout: ${config.name}`, {
      idealEdgeLength: config.idealEdgeLength,
      nodeRepulsion: config.nodeRepulsion,
      numIter: config.numIter,
      animate: config.animate
    });

    // Create COSE-compatible config (works for both cose and cose-bilkent)
    const coseConfig = {
      nodeRepulsion: config.nodeRepulsion,
      idealEdgeLength: config.idealEdgeLength,
      numIter: config.numIter,
      componentSpacing: config.componentSpacing,
      gravity: config.gravity,
      gravityRange: config.gravityRange,
      coolingFactor: config.coolingFactor || 0.99,
      minTemp: config.minTemp || 1.0,
      animate: config.animate === false ? false : true,
      animationDuration: config.animationDuration || 1000,
      animationEasing: config.animationEasing || 'ease-out'
    };

    // Try primary layout
    try {
      this.currentLayout = this.cy.layout({ ...coseConfig, name: config.name }).run();
      console.log(`✓ Layout "${config.name}" applied successfully`);
      return;
    } catch (error) {
      console.warn(`Layout "${config.name}" unavailable:`, error.message);
    }

    // Fallback 1: standard COSE
    try {
      console.log('Trying standard COSE layout...');
      this.currentLayout = this.cy.layout({ ...coseConfig, name: 'cose' }).run();
      console.log('✓ COSE layout applied');
      return;
    } catch (cosError) {
      console.warn('COSE layout also failed:', cosError.message);
    }

    // Fallback 2: grid (better than circle for large graphs)
    try {
      console.log('Trying grid layout...');
      this.currentLayout = this.cy.layout({
        name: 'grid',
        animate: true,
        animationDuration: 500
      }).run();
      console.log('✓ Grid layout applied as fallback');
      return;
    } catch (gridError) {
      console.warn('Grid layout failed:', gridError.message);
    }

    // Final fallback: circle
    console.log('Applying final circle layout fallback');
    this.currentLayout = this.cy.layout({
      name: 'circle',
      animate: true,
      animationDuration: 500
    }).run();
    console.log('✓ Circle layout applied as final fallback');
  }

  /**
   * Update layout parameters
   */
  updateLayoutParams(nodeRepulsion, idealEdgeLength) {
    const newConfig = { ...CONFIG.layout, nodeRepulsion, idealEdgeLength };
    this.runLayout(newConfig);
  }

  /**
   * Toggle edge labels visibility
   */
  toggleEdgeLabels(visible) {
    this.cy.edges().forEach(edge => {
      edge.scratch()._edgeLabelsVisible = visible;
    });
    this.cy.style().update();
  }

  /**
   * Apply search filter (dim non-matching nodes and edges)
   */
  applySearchFilter(searchTerm) {
    const term = searchTerm.toLowerCase();

    this.cy.elements().removeClass('dimmed');

    if (!term) return;

    const matchedNodeIds = new Set();
    this.cy.nodes().forEach(node => {
      const label = node.data('label').toLowerCase();
      if (label.includes(term)) {
        matchedNodeIds.add(node.id());
      }
    });

    // Dim non-matching nodes and their edges
    this.cy.nodes().forEach(node => {
      if (!matchedNodeIds.has(node.id())) {
        node.addClass('dimmed');
      }
    });

    this.cy.edges().forEach(edge => {
      const sourceMatched = matchedNodeIds.has(edge.source().id());
      const targetMatched = matchedNodeIds.has(edge.target().id());
      if (!sourceMatched && !targetMatched) {
        edge.addClass('dimmed');
      }
    });
  }

  /**
   * Apply group filter
   */
  applyGroupFilter(groupIds) {
    const groupSet = new Set(groupIds);
    this.cy.elements().removeClass('dimmed');

    if (groupSet.size === 0) {
      // All groups selected, dim nothing
      return;
    }

    const matchedNodeIds = new Set();
    this.cy.nodes().forEach(node => {
      const group = node.data('group');
      if (groupSet.has(group)) {
        matchedNodeIds.add(node.id());
      } else {
        node.addClass('dimmed');
      }
    });

    this.cy.edges().forEach(edge => {
      const sourceMatched = matchedNodeIds.has(edge.source().id());
      const targetMatched = matchedNodeIds.has(edge.target().id());
      if (!sourceMatched || !targetMatched) {
        edge.addClass('dimmed');
      }
    });
  }

  /**
   * Fit graph to viewport
   */
  fitToViewport() {
    if (this.cy) {
      this.cy.fit(null, 20);
    }
  }

  /**
   * Node click callback - to be overridden
   */
  onNodeClick(node) {
    // Implemented by sidebar.js
  }

  /**
   * Edge click callback - to be overridden
   */
  onEdgeClick(edge) {
    // Implemented by sidebar.js
  }
}
