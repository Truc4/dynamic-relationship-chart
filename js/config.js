// Configuration and constants

const CONFIG = {
  // Layout defaults - try COSE-Bilkent first, falls back to COSE
  layout: {
    name: 'cose-bilkent',
    idealEdgeLength: 100,
    nodeRepulsion: 250000,
    componentSpacing: 30,
    gravity: 0,
    gravityRange: 100,
    numIter: 3000,
    animate: true,
    animationDuration: 500,
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
