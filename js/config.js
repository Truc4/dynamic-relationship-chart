// Configuration and constants

const CONFIG = {
  // Layout defaults - use standard COSE (COSE-Bilkent unavailable from CDN)
  layout: {
    name: 'cose',
    idealEdgeLength: 150,
    nodeRepulsion: 350000,
    componentSpacing: 40,
    gravity: 0.1,
    gravityRange: 300,
    numIter: 1500,
    animate: true,
    animationDuration: 1200,
    animationEasing: 'ease-out',
    // COSE-specific params (used as fallback too)
    coolingFactor: 0.99,
    minTemp: 1.0
  },

  // Node styling defaults
  nodeSize: 80,
  placeholderImage: 'images/placeholder.svg',

  // Default relationship type styling
  defaultRelationshipColor: '#999999',
  defaultRelationshipWidth: 1,

  // Data file paths
  dataFilePath: 'data/relationships.json',
  exampleDataPath: 'data/relationships.example.json'
};
