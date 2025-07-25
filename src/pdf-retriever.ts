import { appConfig } from './config.js';
import { DatabaseService } from './database.js';
import { PdfService } from './pdf-service.js';

interface PdfRetrievalOptions {
  tableName: string;
  blobColumnName: string;
  idColumnName?: string;
  whereClause?: string;
  outputFilenamePrefix?: string;
}

export class PdfRetriever {
  private dbService: DatabaseService;
  private pdfService: PdfService;

  constructor() {
    this.dbService = new DatabaseService();
    this.pdfService = new PdfService(appConfig.pdfOutputDir);
  }

  async initialize(): Promise<void> {
    await this.dbService.initialize(appConfig.database);
  }

  async close(): Promise<void> {
    await this.dbService.close();
  }

  async retrievePdfs(options: PdfRetrievalOptions): Promise<string[]> {
    const { tableName, blobColumnName, idColumnName, whereClause, outputFilenamePrefix } = options;

    try {
      console.log(`Starting PDF retrieval from ${tableName}.${blobColumnName}`);

      if (idColumnName) {
        // Retrieve with metadata for better file naming
        const pdfData = await this.dbService.getPdfBlobWithMetadata(
          tableName,
          blobColumnName,
          idColumnName,
          whereClause
        );

        if (pdfData.length === 0) {
          console.log('No PDF data found');
          return [];
        }

        console.log(`Found ${pdfData.length} PDF(s) to save`);

        // Validate and save PDFs with new naming format
        const savedFiles: string[] = [];
        for (const { id, pdfBuffer, supplierCode, month, supplierInvoiceNum } of pdfData) {
          // Create filename in format: <supplier_code-month_number-SUPPLIER_IV_NUM>
          let filename: string;
          if (supplierCode && month && supplierInvoiceNum) {
            // Clean supplier invoice number (remove special characters that aren't file-safe)
            const cleanInvoiceNum = supplierInvoiceNum.replace(/[<>:"/\\|?*]/g, '_');
            filename = `${supplierCode}-${month}-${cleanInvoiceNum}`;
          } else {
            // Fallback to ID-based naming if metadata is missing
            filename = outputFilenamePrefix ? `${outputFilenamePrefix}_${id}` : `pdf_${id}`;
          }
          
          if (this.pdfService.validatePdfBuffer(pdfBuffer)) {
            const filePath = await this.pdfService.savePdfBuffer(pdfBuffer, filename);
            savedFiles.push(filePath);
          } else {
            console.warn(`Skipping invalid PDF data for ID: ${id}`);
          }
        }

        return savedFiles;
      } else {
        // Retrieve without metadata - use sequential numbering
        const pdfBuffers = await this.dbService.getPdfBlob(tableName, blobColumnName, whereClause);

        if (pdfBuffers.length === 0) {
          console.log('No PDF data found');
          return [];
        }

        console.log(`Found ${pdfBuffers.length} PDF(s) to save`);

        const savedFiles: string[] = [];
        for (let i = 0; i < pdfBuffers.length; i++) {
          const buffer = pdfBuffers[i];
          const filename = outputFilenamePrefix ? `${outputFilenamePrefix}_${i + 1}` : `pdf_${i + 1}`;
          
          if (this.pdfService.validatePdfBuffer(buffer)) {
            const filePath = await this.pdfService.savePdfBuffer(buffer, filename);
            savedFiles.push(filePath);
          } else {
            console.warn(`Skipping invalid PDF data at index: ${i}`);
          }
        }

        return savedFiles;
      }
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      throw error;
    }
  }
}

// Example usage function
export async function retrievePdfsExample(): Promise<void> {
  const retriever = new PdfRetriever();

  try {
    await retriever.initialize();

    // Example 1: Retrieve all PDFs from a table with ID column
    const savedFiles1 = await retriever.retrievePdfs({
      tableName: 'DOCUMENTS',
      blobColumnName: 'PDF_DATA',
      idColumnName: 'DOC_ID',
      outputFilenamePrefix: 'document'
    });

    console.log('Saved files (Example 1):', savedFiles1);

    // Example 2: Retrieve PDFs with a WHERE clause
    const savedFiles2 = await retriever.retrievePdfs({
      tableName: 'REPORTS',
      blobColumnName: 'REPORT_PDF',
      idColumnName: 'REPORT_ID',
      whereClause: "CREATED_DATE >= SYSDATE - 30", // Last 30 days
      outputFilenamePrefix: 'report'
    });

    console.log('Saved files (Example 2):', savedFiles2);

  } finally {
    await retriever.close();
  }
}
