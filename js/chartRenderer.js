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
        name: 'preset' // Start with no layout, we'll run COSE separately
      },
      wheelSensitivity: 0.1,
      pixelRatio: 1
    });

    // Run initial layout (COSE-Bilkent is auto-registered from CDN)
    this.runLayout();

    // Add node click handler
    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      this.onNodeClick(node);
    });

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
   * Run COSE layout
   */
  runLayout(layoutConfig = null) {
    if (!this.cy) return;

    const config = layoutConfig || CONFIG.layout;
    try {
      this.currentLayout = this.cy.layout({
        ...config,
        animate: true,
        animationDuration: 500
      }).run();
    } catch (error) {
      // Fallback to circle layout if cose-bilkent isn't available
      console.warn(`Layout "${config.name}" not available, falling back to circle layout:`, error.message);
      this.currentLayout = this.cy.layout({
        name: 'circle',
        animate: true,
        animationDuration: 500
      }).run();
    }
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
}
