import { DocPage, ServerConfig } from '../types.js';

/**
 * Manages documentation retrieval and search
 */
export class DocsManager {
  private baseUrl: string;

  constructor(config: ServerConfig) {
    this.baseUrl = config.baseUrls.docs;
  }

  /**
   * Fetch a documentation page
   */
  async getDocPage(path: string): Promise<DocPage | null> {
    try {
      const url = `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const content = await response.text();

      return {
        title: this.extractTitle(content),
        content,
        url,
        lastUpdated: response.headers.get('last-modified') || undefined
      };
    } catch (error) {
      console.error('Error fetching doc page:', error);
      return null;
    }
  }

  /**
   * Search documentation (basic implementation)
   * For production, you'd want to integrate with a search API or index
   */
  async searchDocs(query: string, paths: string[] = ['/']): Promise<DocPage[]> {
    const results: DocPage[] = [];

    for (const path of paths) {
      const page = await this.getDocPage(path);
      if (page && this.pageMatchesQuery(page, query)) {
        results.push(page);
      }
    }

    return results;
  }

  /**
   * Get documentation for a specific endpoint
   */
  async getEndpointDocs(endpointId: string): Promise<DocPage | null> {
    // Convention: endpoint docs are at /endpoints/{endpointId}
    return this.getDocPage(`/endpoints/${endpointId}`);
  }

  /**
   * Extract title from HTML or markdown content
   */
  private extractTitle(content: string): string {
    // Try to extract from HTML <title> tag
    const htmlTitleMatch = content.match(/<title>(.*?)<\/title>/i);
    if (htmlTitleMatch) {
      return htmlTitleMatch[1];
    }

    // Try to extract from markdown # heading
    const mdTitleMatch = content.match(/^#\s+(.+)$/m);
    if (mdTitleMatch) {
      return mdTitleMatch[1];
    }

    // Try to extract from <h1> tag
    const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].replace(/<[^>]*>/g, ''); // Strip HTML tags
    }

    return 'Untitled';
  }

  /**
   * Check if a page matches a search query (simple implementation)
   */
  private pageMatchesQuery(page: DocPage, query: string): boolean {
    const searchText = `${page.title} ${page.content}`.toLowerCase();
    const queryLower = query.toLowerCase();
    return searchText.includes(queryLower);
  }
}
