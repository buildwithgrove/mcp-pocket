import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocsManager } from '../docs-manager.js';
import type { ServerConfig } from '../../types.js';

describe('DocsManager', () => {
  let docsManager: DocsManager;
  let mockConfig: ServerConfig;

  beforeEach(() => {
    mockConfig = {
      baseUrls: {
        endpoints: 'https://api.example.com',
        docs: 'https://docs.example.com',
      },
      categories: [],
      endpoints: [],
    };

    docsManager = new DocsManager(mockConfig);

    vi.restoreAllMocks();
  });

  describe('getDocPage', () => {
    it('should fetch documentation page successfully', async () => {
      const mockContent = `
        <html>
          <head><title>API Documentation</title></head>
          <body><h1>Welcome</h1></body>
        </html>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockContent,
        headers: {
          get: (key: string) => key === 'last-modified' ? '2024-01-01' : null,
        },
      });

      const result = await docsManager.getDocPage('/getting-started');

      expect(result).not.toBeNull();
      expect(result?.title).toBe('API Documentation');
      expect(result?.content).toContain('Welcome');
      expect(result?.url).toContain('/getting-started');
      expect(result?.lastUpdated).toBe('2024-01-01');
    });

    it('should extract title from markdown heading', async () => {
      const mockContent = '# Getting Started\n\nThis is the content.';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockContent,
        headers: {
          get: () => null,
        },
      });

      const result = await docsManager.getDocPage('/guide');

      expect(result?.title).toBe('Getting Started');
    });

    it('should extract title from h1 tag', async () => {
      const mockContent = '<h1>Main Title</h1><p>Content</p>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockContent,
        headers: {
          get: () => null,
        },
      });

      const result = await docsManager.getDocPage('/page');

      expect(result?.title).toBe('Main Title');
    });

    it('should handle h1 tag with HTML content', async () => {
      const mockContent = '<h1><span class="icon">📖</span> Documentation</h1>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockContent,
        headers: {
          get: () => null,
        },
      });

      const result = await docsManager.getDocPage('/page');

      expect(result?.title).toContain('Documentation');
    });

    it('should use "Untitled" when no title found', async () => {
      const mockContent = '<p>Just some content</p>';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockContent,
        headers: {
          get: () => null,
        },
      });

      const result = await docsManager.getDocPage('/page');

      expect(result?.title).toBe('Untitled');
    });

    it('should handle paths without leading slash', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<h1>Test</h1>',
        headers: {
          get: () => null,
        },
      });

      await docsManager.getDocPage('no-slash');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://docs.example.com/no-slash'
      );
    });

    it('should handle paths with leading slash', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '<h1>Test</h1>',
        headers: {
          get: () => null,
        },
      });

      await docsManager.getDocPage('/with-slash');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://docs.example.com/with-slash'
      );
    });

    it('should return null on 404 error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await docsManager.getDocPage('/nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await docsManager.getDocPage('/error');

      expect(result).toBeNull();
    });
  });

  describe('searchDocs', () => {
    it('should find matching documentation pages', async () => {
      const pages = [
        { path: '/intro', content: '# Introduction\nLearn about our API' },
        { path: '/auth', content: '# Authentication\nHow to authenticate' },
        { path: '/webhooks', content: '# Webhooks\nWebhook configuration' },
      ];

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        const page = pages[callCount++];
        return Promise.resolve({
          ok: true,
          text: async () => page.content,
          headers: {
            get: () => null,
          },
        });
      });

      const results = await docsManager.searchDocs('authentication', [
        '/intro',
        '/auth',
        '/webhooks',
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Authentication');
    });

    it('should search in title and content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# API Guide\nThis document covers webhooks',
        headers: {
          get: () => null,
        },
      });

      const results = await docsManager.searchDocs('webhooks', ['/guide']);

      expect(results).toHaveLength(1);
    });

    it('should be case insensitive', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Guide\nContent about AUTHENTICATION',
        headers: {
          get: () => null,
        },
      });

      const results = await docsManager.searchDocs('authentication', ['/guide']);

      expect(results).toHaveLength(1);
    });

    it('should return empty array when no matches', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Guide\nSome other content',
        headers: {
          get: () => null,
        },
      });

      const results = await docsManager.searchDocs('nonexistent', ['/guide']);

      expect(results).toHaveLength(0);
    });

    it('should skip pages that fail to load', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        if (callCount++ === 0) {
          return Promise.resolve({
            ok: false,
            status: 404,
          });
        }
        return Promise.resolve({
          ok: true,
          text: async () => '# Valid Page\nContains search term',
          headers: {
            get: () => null,
          },
        });
      });

      const results = await docsManager.searchDocs('search term', [
        '/error',
        '/valid',
      ]);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Valid Page');
    });

    it('should search default path when none provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Home\nWelcome',
        headers: {
          get: () => null,
        },
      });

      const results = await docsManager.searchDocs('welcome');

      expect(results).toHaveLength(1);
    });
  });

  describe('getEndpointDocs', () => {
    it('should fetch endpoint documentation', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Get Balance\nReturns wallet balance',
        headers: {
          get: () => null,
        },
      });

      const result = await docsManager.getEndpointDocs('get-balance');

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Get Balance');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://docs.example.com/endpoints/get-balance'
      );
    });

    it('should return null for non-existent endpoint docs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await docsManager.getEndpointDocs('nonexistent');

      expect(result).toBeNull();
    });

    it('should construct correct path for endpoint docs', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => '# Docs',
        headers: {
          get: () => null,
        },
      });

      await docsManager.getEndpointDocs('create-webhook');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/endpoints/create-webhook')
      );
    });
  });
});
