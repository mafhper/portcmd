import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectory, readDirFiles } from '../utils/fs.utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '../../../../');
const REPORTS_DIR = path.join(ROOT_DIR, 'performance-reports', 'quality');

export const ReportsService = {
  /**
   * List all quality reports, sorted by timestamp (newest first).
   * @param {string} [target] - Optional filter by target (app, promo)
   * @param {number} [limit=50] - Max reports to return
   */
  async listQualityReports(target, limit = 50) {
    await ensureDirectory(REPORTS_DIR);
    
    // Use readDirFiles helper if available or standard fs
    const files = await fs.readdir(REPORTS_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f.startsWith('quality-'));

    const reports = await Promise.all(jsonFiles.map(async (filename) => {
      try {
        const filePath = path.join(REPORTS_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Extract timestamp from filename or data
        const timestampMatch = filename.match(/quality-(\d+)\.json/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : (data.meta?.generatedAt || data.timestamp || 0);

        return {
          filename,
          timestamp,
          data
        };
      } catch (err) {
        console.error(`Failed to parse report ${filename}:`, err.message);
        return null;
      }
    }));

    // Filter valid reports
    let validReports = reports.filter(r => r !== null);

    // Apply filters
    if (target) {
        validReports = validReports.filter(r => (r.data.target === target || (r.data.meta && r.data.meta.preset === target)));
    }

    // Sort by timestamp desc
    validReports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return validReports.slice(0, limit);
  },

  /**
   * Get a specific report by filename.
   */
  async getQualityReport(filename) {
    const filePath = path.join(REPORTS_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  },
  
  /**
   * Delete a specific report
   */
  async deleteReport(filename) {
      const filePath = path.join(REPORTS_DIR, filename);
      // Also try to delete md if exists
      const mdPath = filePath.replace('.json', '.md');
      
      try {
        await fs.unlink(filePath);
        await fs.unlink(mdPath).catch(() => {}); // Ignore md error
        return true;
      } catch (e) {
        return false;
      }
  }
};
