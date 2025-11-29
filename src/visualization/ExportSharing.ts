/**
 * ExportSharing - PRD-17 Phase 17.5
 * Export and sharing capabilities for visualizations
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Export formats
export type ExportFormat = 
  | 'png'
  | 'svg'
  | 'pdf'
  | 'mp4'
  | 'gif'
  | 'json';

// Image export result
export interface ImageExport {
  id: string;
  format: ExportFormat;
  width: number;
  height: number;
  dataUrl: string;
  fileSize: number;
  timestamp: Date;
  hash: string;
}

// Video export result
export interface VideoExport {
  id: string;
  format: 'mp4' | 'gif';
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  fileSize: number;
  url: string;
  hash: string;
}

// Shareable link
export interface ShareableLink {
  id: string;
  visualizationId: string;
  type: 'view' | 'embed' | 'collaborate';
  url: string;
  shortUrl: string;
  expiresAt: Date | null;
  accessCount: number;
  permissions: SharePermissions;
  hash: string;
}

export interface SharePermissions {
  canView: boolean;
  canInteract: boolean;
  canDownload: boolean;
  canEmbed: boolean;
}

// Embed code
export interface EmbedCode {
  visualizationId: string;
  iframeCode: string;
  scriptCode: string;
  width: number;
  height: number;
  responsive: boolean;
  hash: string;
}

/**
 * ExportSharing - Main export and sharing class
 */
export class ExportSharing {
  private logger: Logger;
  private exports: Map<string, ImageExport | VideoExport> = new Map();
  private links: Map<string, ShareableLink> = new Map();
  private exportCount: number = 0;
  private linkCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
  }

  /**
   * Export as image
   */
  exportImage(visualizationId: string, format: 'png' | 'svg' | 'pdf', options?: {
    width?: number;
    height?: number;
  }): ImageExport {
    const id = `export-img-${++this.exportCount}`;
    
    const width = options?.width || 1920;
    const height = options?.height || 1080;

    // Generate placeholder data URL (in real implementation would render actual image)
    const dataUrl = `data:image/${format};base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    const imageExport: ImageExport = {
      id,
      format,
      width,
      height,
      dataUrl,
      fileSize: width * height * 4, // Approximate
      timestamp: new Date(),
      hash: ''
    };
    imageExport.hash = HashVerifier.hash(JSON.stringify({ ...imageExport, hash: '' }));

    this.exports.set(id, imageExport);

    this.logger.info('Image exported', {
      id,
      visualizationId,
      format,
      width,
      height,
      hash: imageExport.hash
    });

    return imageExport;
  }

  /**
   * Export as video
   */
  exportVideo(visualizationId: string, format: 'mp4' | 'gif', options?: {
    width?: number;
    height?: number;
    duration?: number;
    frameRate?: number;
  }): VideoExport {
    const id = `export-vid-${++this.exportCount}`;
    
    const width = options?.width || 1920;
    const height = options?.height || 1080;
    const duration = options?.duration || 10;
    const frameRate = options?.frameRate || 30;

    const videoExport: VideoExport = {
      id,
      format,
      width,
      height,
      duration,
      frameRate,
      fileSize: width * height * duration * frameRate * 0.1, // Approximate compressed
      url: `https://exports.reframed-laws.com/${id}.${format}`,
      hash: ''
    };
    videoExport.hash = HashVerifier.hash(JSON.stringify({ ...videoExport, hash: '' }));

    this.exports.set(id, videoExport);

    this.logger.info('Video exported', {
      id,
      visualizationId,
      format,
      duration,
      hash: videoExport.hash
    });

    return videoExport;
  }

  /**
   * Create shareable link
   */
  createShareableLink(visualizationId: string, type: ShareableLink['type'], options?: {
    expiresIn?: number; // hours
    permissions?: Partial<SharePermissions>;
  }): ShareableLink {
    const id = `link-${++this.linkCount}`;
    
    const shortCode = Math.random().toString(36).substring(2, 8);
    const expiresAt = options?.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 3600000)
      : null;

    const permissions: SharePermissions = {
      canView: true,
      canInteract: type !== 'view' ? true : false,
      canDownload: options?.permissions?.canDownload || false,
      canEmbed: type === 'embed',
      ...options?.permissions
    };

    const link: ShareableLink = {
      id,
      visualizationId,
      type,
      url: `https://reframed-laws.com/view/${visualizationId}?share=${id}`,
      shortUrl: `https://rfl.io/${shortCode}`,
      expiresAt,
      accessCount: 0,
      permissions,
      hash: ''
    };
    link.hash = HashVerifier.hash(JSON.stringify({ ...link, hash: '' }));

    this.links.set(id, link);

    this.logger.info('Shareable link created', {
      id,
      visualizationId,
      type,
      shortUrl: link.shortUrl,
      hash: link.hash
    });

    return link;
  }

  /**
   * Generate embed code
   */
  generateEmbedCode(visualizationId: string, options?: {
    width?: number;
    height?: number;
    responsive?: boolean;
  }): EmbedCode {
    const width = options?.width || 800;
    const height = options?.height || 600;
    const responsive = options?.responsive !== false;

    const iframeCode = responsive
      ? `<div style="position:relative;padding-bottom:${(height/width)*100}%;height:0;overflow:hidden;"><iframe src="https://reframed-laws.com/embed/${visualizationId}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allowfullscreen></iframe></div>`
      : `<iframe src="https://reframed-laws.com/embed/${visualizationId}" width="${width}" height="${height}" frameborder="0" allowfullscreen></iframe>`;

    const scriptCode = `<script src="https://reframed-laws.com/embed.js" data-viz="${visualizationId}"${responsive ? ' data-responsive="true"' : ''}></script>`;

    const embedCode: EmbedCode = {
      visualizationId,
      iframeCode,
      scriptCode,
      width,
      height,
      responsive,
      hash: ''
    };
    embedCode.hash = HashVerifier.hash(JSON.stringify({ ...embedCode, hash: '' }));

    return embedCode;
  }

  /**
   * Track link access
   */
  trackAccess(linkId: string): boolean {
    const link = this.links.get(linkId);
    if (!link) return false;

    // Check expiration
    if (link.expiresAt && new Date() > link.expiresAt) {
      return false;
    }

    link.accessCount++;
    link.hash = HashVerifier.hash(JSON.stringify({ ...link, hash: '' }));
    
    return true;
  }

  /**
   * Get all exports
   */
  getAllExports(): (ImageExport | VideoExport)[] {
    return Array.from(this.exports.values());
  }

  /**
   * Get all links
   */
  getAllLinks(): ShareableLink[] {
    return Array.from(this.links.values());
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      exportCount: this.exports.size,
      linkCount: this.links.size
    }));
  }
}

/**
 * Factory for creating ExportSharing
 */
export class ExportSharingFactory {
  static createDefault(): ExportSharing {
    return new ExportSharing();
  }
}
