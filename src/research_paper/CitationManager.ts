/**
 * CitationManager - PRD-16 Phase 16.2
 * Citation database and bibliography generation
 */

import { Logger } from '../core/logger/Logger';
import { HashVerifier } from '../core/logger/HashVerifier';

// Citation types
export type CitationType = 
  | 'journal'
  | 'conference'
  | 'book'
  | 'preprint'
  | 'thesis'
  | 'website';

// Citation entry
export interface Citation {
  id: string;
  type: CitationType;
  authors: string[];
  title: string;
  journal?: string;
  volume?: number;
  pages?: string;
  year: number;
  doi?: string;
  url?: string;
  hash: string;
}

// Bibliography
export interface Bibliography {
  id: string;
  style: 'apa' | 'mla' | 'chicago' | 'ieee' | 'nature';
  citations: Citation[];
  formatted: string[];
  hash: string;
}

/**
 * CitationManager - Main citation management class
 */
export class CitationManager {
  private logger: Logger;
  private citations: Map<string, Citation> = new Map();
  private citationCount: number = 0;

  constructor() {
    this.logger = Logger.getInstance();
    this.initializeCitations();
  }

  private initializeCitations(): void {
    // Core physics references
    this.addCitation({
      type: 'journal',
      authors: ['Einstein, A.'],
      title: 'Die Grundlage der allgemeinen Relativitätstheorie',
      journal: 'Annalen der Physik',
      volume: 354,
      pages: '769-822',
      year: 1916,
      doi: '10.1002/andp.19163540702'
    });

    this.addCitation({
      type: 'journal',
      authors: ['Dirac, P.A.M.'],
      title: 'The Quantum Theory of the Electron',
      journal: 'Proceedings of the Royal Society A',
      volume: 117,
      pages: '610-624',
      year: 1928,
      doi: '10.1098/rspa.1928.0023'
    });

    this.addCitation({
      type: 'journal',
      authors: ['Feynman, R.P.'],
      title: 'Simulating Physics with Computers',
      journal: 'International Journal of Theoretical Physics',
      volume: 21,
      pages: '467-488',
      year: 1982,
      doi: '10.1007/BF02650179'
    });

    this.addCitation({
      type: 'journal',
      authors: ['Alcubierre, M.'],
      title: 'The warp drive: hyper-fast travel within general relativity',
      journal: 'Classical and Quantum Gravity',
      volume: 11,
      pages: 'L73-L77',
      year: 1994,
      doi: '10.1088/0264-9381/11/5/001'
    });

    this.addCitation({
      type: 'journal',
      authors: ['Shor, P.W.'],
      title: 'Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer',
      journal: 'SIAM Journal on Computing',
      volume: 26,
      pages: '1484-1509',
      year: 1997,
      doi: '10.1137/S0097539795293172'
    });
  }

  /**
   * Add citation
   */
  addCitation(config: Omit<Citation, 'id' | 'hash'>): Citation {
    const id = `cite-${++this.citationCount}`;
    
    const citation: Citation = {
      id,
      ...config,
      hash: ''
    };
    citation.hash = HashVerifier.hash(JSON.stringify({ ...citation, hash: '' }));

    this.citations.set(id, citation);

    this.logger.info('Citation added', {
      id,
      title: config.title,
      year: config.year,
      hash: citation.hash
    });

    return citation;
  }

  /**
   * Generate bibliography
   */
  generateBibliography(citationIds: string[], style: Bibliography['style']): Bibliography {
    const citations = citationIds.map(id => this.citations.get(id)).filter((c): c is Citation => c !== undefined);
    
    const formatted = citations.map(c => this.formatCitation(c, style));

    const bib: Bibliography = {
      id: `bib-${Date.now()}`,
      style,
      citations,
      formatted,
      hash: ''
    };
    bib.hash = HashVerifier.hash(JSON.stringify({ ...bib, hash: '' }));

    return bib;
  }

  private formatCitation(citation: Citation, style: Bibliography['style']): string {
    const authors = citation.authors.join(', ');
    
    switch (style) {
      case 'apa':
        return `${authors} (${citation.year}). ${citation.title}. ${citation.journal || ''}, ${citation.volume || ''}, ${citation.pages || ''}.`;
      case 'ieee':
        return `${authors}, "${citation.title}," ${citation.journal || ''}, vol. ${citation.volume || ''}, pp. ${citation.pages || ''}, ${citation.year}.`;
      case 'nature':
        return `${authors} ${citation.title}. ${citation.journal || ''} ${citation.volume || ''}, ${citation.pages || ''} (${citation.year}).`;
      default:
        return `${authors}. ${citation.title}. ${citation.year}.`;
    }
  }

  /**
   * Search citations
   */
  search(query: string): Citation[] {
    const q = query.toLowerCase();
    return Array.from(this.citations.values()).filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.authors.some(a => a.toLowerCase().includes(q))
    );
  }

  /**
   * Get all citations
   */
  getAllCitations(): Citation[] {
    return Array.from(this.citations.values());
  }

  /**
   * Get citation by ID
   */
  getCitation(id: string): Citation | undefined {
    return this.citations.get(id);
  }

  /**
   * Get hash
   */
  getHash(): string {
    return HashVerifier.hash(JSON.stringify({
      citationCount: this.citations.size
    }));
  }
}

/**
 * Factory for creating CitationManager
 */
export class CitationManagerFactory {
  static createDefault(): CitationManager {
    return new CitationManager();
  }
}
