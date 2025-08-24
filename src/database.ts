import oracledb from "oracledb";
import { DatabaseConfig } from "./config.js";

export class DatabaseService {
  private pool: oracledb.Pool | null = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    try {
      this.pool = await oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        poolMin: config.poolMin || 1,
        poolMax: config.poolMax || 10,
        poolIncrement: config.poolIncrement || 1,
      });

      console.log("Database connection pool created successfully");
    } catch (error) {
      console.error("Error creating database connection pool:", error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log("Database connection pool closed");
    }
  }

  async getPdfBlobWithMetadata(invoiceCodes: string[]): Promise<
    Array<{
      supplierCode: string;
      month: number;
      supplierInvoiceNumber: string;
      blobContent: Buffer;
    }>
  > {
    if (!this.pool) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    let connection: oracledb.Connection | undefined;
    try {
      connection = await this.pool.getConnection();

      const codesList = invoiceCodes.map(code => `'${code.replace(/'/g, "''")}'`).join(', ');
      const query = `
        select s.CODE as supplierCode, 
        EXTRACT(MONTH FROM i.INVOICE_DATE) as invoiceMonth, 
          i.SUPPLIER_IV_NUM as supplierInvoiceNumber, 
          ia.BLOB_CONTENT as blobContent
        from INVOICE_ATTACHMENTS ia
          JOIN INVOICES i ON ia.INVOICE_ID = i.ID
          JOIN SUPPLIERS s ON i.SUPPLIER_ID = s.ID
        where i.SUPPLIER_IV_NUM in (${codesList})
      `;

      console.log(`Executing query:\n ${query}`);

      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_ARRAY,
      });

      if (!result.rows || result.rows.length === 0) {
        console.log("No rows found");
        return [];
      }

      const invoices: Array<{
        supplierCode: string;
        month: number;
        supplierInvoiceNumber: string;
        blobContent: Buffer;
      }> = [];

      for (const row of result.rows) {
        const rowArray = row as any[];
        const supplierCode = rowArray[0] as string;
        const month = rowArray[1] as number;
        const supplierInvoiceNumber = rowArray[2] as string;
        const blobData = rowArray[3] as oracledb.Lob;

        if (blobData && typeof blobData.getData === "function") {
          const buffer = await blobData.getData();
          if (Buffer.isBuffer(buffer)) {
            invoices.push({
              supplierCode,
              month,
              blobContent: buffer,
              supplierInvoiceNumber: supplierInvoiceNumber,
            });
          }
        } else if (Buffer.isBuffer(blobData)) {
          invoices.push({
            supplierCode,
            month,
            supplierInvoiceNumber: supplierInvoiceNumber,
            blobContent: blobData,
          });
        } else {
          console.warn(
            `Unexpected data type for BLOB column in row with ID: ${supplierInvoiceNumber}`
          );
        }
      }

      return invoices;
    } catch (error) {
      console.error("Error retrieving PDF BLOB data with metadata:", error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }
}
