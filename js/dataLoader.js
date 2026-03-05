// Data loading and validation

class DataLoader {
  constructor() {
    this.data = null;
  }

  /**
   * Fetch and parse JSON data
   */
  async loadData(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      this.validateData(data);
      this.data = data;
      return data;
    } catch (error) {
      throw new Error(`Failed to load ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate JSON schema
   */
  validateData(data) {
    if (!data.people || !Array.isArray(data.people)) {
      throw new Error('Missing or invalid "people" array');
    }
    if (!data.relationships || !Array.isArray(data.relationships)) {
      throw new Error('Missing or invalid "relationships" array');
    }
    if (!data.relationshipTypes || !Array.isArray(data.relationshipTypes)) {
      throw new Error('Missing or invalid "relationshipTypes" array');
    }
    if (!data.groups || !Array.isArray(data.groups)) {
      throw new Error('Missing or invalid "groups" array');
    }

    // Validate people
    const personIds = new Set();
    data.people.forEach((person, idx) => {
      if (!person.id || typeof person.id !== 'string') {
        throw new Error(`Person ${idx}: missing or invalid "id"`);
      }
      if (!person.name || typeof person.name !== 'string') {
        throw new Error(`Person ${idx}: missing or invalid "name"`);
      }
      if (personIds.has(person.id)) {
        throw new Error(`Duplicate person id: "${person.id}"`);
      }
      personIds.add(person.id);
    });

    // Validate relationships
    data.relationships.forEach((rel, idx) => {
      if (!rel.source || !personIds.has(rel.source)) {
        throw new Error(`Relationship ${idx}: invalid source "${rel.source}"`);
      }
      if (!rel.target || !personIds.has(rel.target)) {
        throw new Error(`Relationship ${idx}: invalid target "${rel.target}"`);
      }
      if (!rel.type || typeof rel.type !== 'string') {
        throw new Error(`Relationship ${idx}: missing or invalid "type"`);
      }
    });
  }

  /**
   * Transform JSON data into Cytoscape elements format
   */
  transformToCytoscapeFormat(data) {
    const elements = [];

    // Add nodes
    data.people.forEach(person => {
      const nodeData = {
        id: person.id,
        label: person.name,
        image: person.image || CONFIG.placeholderImage,
        group: person.group || 'default',
        bio: person.bio || ''
      };
      elements.push({ data: nodeData });
    });

    // Add edges
    data.relationships.forEach(rel => {
      const edgeData = {
        source: rel.source,
        target: rel.target,
        relationType: rel.type,
        label: rel.label || rel.type
      };
      elements.push({ data: edgeData });
    });

    return elements;
  }

  /**
   * Get relationship type styling
   */
  getRelationshipTypeMap(data) {
    const map = {};
    data.relationshipTypes.forEach(relType => {
      map[relType.type] = {
        color: relType.color,
        width: relType.width
      };
    });
    return map;
  }

  /**
   * Get group styling map
   */
  getGroupMap(data) {
    const map = {};
    data.groups.forEach(group => {
      map[group.id] = {
        label: group.label,
        color: group.nodeColor
      };
    });
    return map;
  }
}
