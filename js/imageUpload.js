// Image upload and drag-to-node functionality

class ImageUpload {
  constructor(renderer, sidebar) {
    this.renderer = renderer;
    this.sidebar = sidebar;
    this.imageMap = {}; // nodeId -> data:// URL
  }

  /**
   * Initialize image upload
   */
  initialize() {
    const imageUploadInput = document.getElementById('imageUploadInput');
    imageUploadInput.addEventListener('change', (e) => this.onBulkImageUpload(e));

    // Setup drag-to-node on canvas
    const cyContainer = document.getElementById('cy');
    cyContainer.addEventListener('dragover', (e) => e.preventDefault());
    cyContainer.addEventListener('drop', (e) => this.onCanvasDrop(e));
  }

  /**
   * Handle bulk image upload
   */
  onBulkImageUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    let matched = 0;
    const unmatched = [];

    Array.from(files).forEach(file => {
      const stem = this.getFilenameStem(file.name);
      const nodeId = this.findNodeIdByStem(stem);

      if (nodeId) {
        this.loadImageAsDataUrl(file, (dataUrl) => {
          this.assignImageToNode(nodeId, dataUrl);
        });
        matched++;
      } else {
        unmatched.push(file.name);
      }
    });

    if (unmatched.length > 0) {
      this.sidebar.showError(`${unmatched.length} image(s) not matched to any person: ${unmatched.slice(0, 3).join(', ')}`);
    }

    this.sidebar.showSuccess(`${matched} image(s) loaded successfully`);
  }

  /**
   * Handle drop on canvas
   */
  onCanvasDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (!files.length) return;

    // Get the drop position
    const rect = document.getElementById('cy').getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find node at drop position
    const nodes = this.renderer.cy.elementsAt({ x, y }).nodes();
    if (nodes.length === 0) {
      this.sidebar.showError('No node at drop location. Drop on a node to assign image.');
      return;
    }

    const node = nodes[0];
    const file = files[0]; // Use first file

    if (!file.type.startsWith('image/')) {
      this.sidebar.showError('Please drop an image file');
      return;
    }

    this.loadImageAsDataUrl(file, (dataUrl) => {
      this.assignImageToNode(node.id(), dataUrl);
      this.sidebar.showSuccess(`Image assigned to ${node.data('label')}`);
    });
  }

  /**
   * Load file as data URL
   */
  loadImageAsDataUrl(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Get filename without extension
   */
  getFilenameStem(filename) {
    return filename.split('.').slice(0, -1).join('.').toLowerCase();
  }

  /**
   * Find node ID by filename stem (exact or partial match)
   */
  findNodeIdByStem(stem) {
    const nodes = this.renderer.cy.nodes();

    // First try exact match with node ID
    for (let node of nodes) {
      if (node.id().toLowerCase() === stem) {
        return node.id();
      }
    }

    // Then try match with lowercased node label
    for (let node of nodes) {
      const labelStem = this.getFilenameStem(node.data('label'));
      if (labelStem === stem) {
        return node.id();
      }
    }

    return null;
  }

  /**
   * Assign image to node and update visualization
   */
  assignImageToNode(nodeId, dataUrl) {
    this.imageMap[nodeId] = dataUrl;

    const node = this.renderer.cy.getElementById(nodeId);
    if (node) {
      node.data('image', dataUrl);
      this.renderer.cy.style().update();
    }
  }
}
