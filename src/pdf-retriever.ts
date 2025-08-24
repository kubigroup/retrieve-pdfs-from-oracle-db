import { appConfig } from './config.js';
import { DatabaseService } from './database.js';
import { PdfService } from './pdf-service.js';

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

  async retrievePdfs(invoiceCodes: string[]): Promise<string[]> {
    try {
      console.log(`Starting PDF retrieval from INVOICE_ATTACHMENTS.BLOB_CONTENT`);

      const invoices = await this.dbService.getPdfBlobWithMetadata(invoiceCodes);

      if (invoices.length === 0) {
        console.log('No PDF data found');
        return [];
      }

      console.log(`Found ${invoices.length} PDF(s) to save`);

      const savedFiles: string[] = [];
      for (const { supplierCode, month, supplierInvoiceNumber, blobContent } of invoices) {
        // Create filename in format: <supplier_code-month_number-SUPPLIER_IV_NUM>
        let filename: string;
        // Clean supplier invoice number (remove special characters that aren't file-safe)
        const cleanSupplierInvoiceNumber = supplierInvoiceNumber.replace(/[<>:"/\\|?*]/g, '_');
        filename = `${supplierCode}-${month}-${cleanSupplierInvoiceNumber}-${new Date().valueOf().toString(16)}`;

        if (this.pdfService.validatePdfBuffer(blobContent)) {
          const filePath = await this.pdfService.savePdfBuffer(blobContent, filename);
          savedFiles.push(filePath);
        } else {
          console.warn(`Skipping invalid PDF data for ID: ${supplierInvoiceNumber}`);
        }
      }

      return savedFiles;
    } catch (error) {
      console.error('Error retrieving PDFs:', error);
      throw error;
    }
  }
}
