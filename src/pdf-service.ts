import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export class PdfService {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
      console.log(`Created output directory: ${this.outputDir}`);
    }
  }

  async savePdfBuffer(buffer: Buffer, filename: string): Promise<string> {
    await this.ensureOutputDirectory();
    
    // Ensure filename has .pdf extension
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }
    
    const filePath = join(this.outputDir, filename);
    
    try {
      await fs.writeFile(filePath, buffer);
      console.log(`PDF saved successfully: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error saving PDF file ${filename}:`, error);
      throw error;
    }
  }

  async savePdfBuffers(pdfData: Array<{ id: any; pdfBuffer: Buffer }>): Promise<string[]> {
    await this.ensureOutputDirectory();
    
    const savedFiles: string[] = [];
    
    for (const { id, pdfBuffer } of pdfData) {
      const filename = `pdf_${id}.pdf`;
      try {
        const filePath = await this.savePdfBuffer(pdfBuffer, filename);
        savedFiles.push(filePath);
      } catch (error) {
        console.error(`Failed to save PDF with ID ${id}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    return savedFiles;
  }

  validatePdfBuffer(buffer: Buffer): boolean {
    // Check if buffer starts with PDF magic number
    if (buffer.length < 4) {
      return false;
    }
    
    const pdfHeader = buffer.slice(0, 4).toString();
    return pdfHeader === '%PDF';
  }

  async validateAndSavePdf(buffer: Buffer, filename: string): Promise<string | null> {
    if (!this.validatePdfBuffer(buffer)) {
      console.warn(`Invalid PDF data for file: ${filename}`);
      return null;
    }
    
    return await this.savePdfBuffer(buffer, filename);
  }
}
