// PNG/JPEG export functionality

class Exporter {
  constructor(cy) {
    this.cy = cy;
  }

  /**
   * Export graph as PNG
   */
  async exportPNG(transparentBg = false) {
    try {
      const blob = await this.cy.png({
        output: 'blob-promise',
        bg: transparentBg ? 'transparent' : '#ffffff',
        full: true,
        scale: 2
      });
      this.downloadBlob(blob, 'relationship-chart.png');
    } catch (error) {
      throw new Error(`PNG export failed: ${error.message}`);
    }
  }

  /**
   * Export graph as JPEG
   */
  async exportJPEG(transparentBg = false) {
    try {
      const blob = await this.cy.jpg({
        output: 'blob-promise',
        bg: transparentBg ? 'transparent' : '#ffffff',
        full: true,
        scale: 2,
        quality: 0.95
      });
      this.downloadBlob(blob, 'relationship-chart.jpg');
    } catch (error) {
      throw new Error(`JPEG export failed: ${error.message}`);
    }
  }

  /**
   * Trigger browser download
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
