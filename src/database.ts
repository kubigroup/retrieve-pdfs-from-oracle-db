import oracledb from 'oracledb';
import { DatabaseConfig } from './config.js';

export class DatabaseService {
  private pool: oracledb.Pool | null = null;

  async initialize(config: DatabaseConfig): Promise<void> {
    try {
      // Create connection pool
      this.pool = await oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: config.connectString,
        poolMin: config.poolMin || 1,
        poolMax: config.poolMax || 10,
        poolIncrement: config.poolIncrement || 1,
      });

      console.log('Database connection pool created successfully');
    } catch (error) {
      console.error('Error creating database connection pool:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('Database connection pool closed');
    }
  }

  async getPdfBlob(tableName: string, blobColumnName: string, whereClause?: string): Promise<Buffer[]> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    let connection: oracledb.Connection | undefined;
    try {
      connection = await this.pool.getConnection();
      
      let query = `SELECT ${blobColumnName} FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      console.log(`Executing query: ${query}`);
      
      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_ARRAY
      });
      
      if (!result.rows || result.rows.length === 0) {
        console.log('No rows found');
        return [];
      }

      const pdfBuffers: Buffer[] = [];
      
      for (const row of result.rows) {
        const rowArray = row as any[];
        const blobData = rowArray[0] as oracledb.Lob;
        
        if (blobData && typeof blobData.getData === 'function') {
          // For LOB data, get the data as Buffer
          const buffer = await blobData.getData();
          if (Buffer.isBuffer(buffer)) {
            pdfBuffers.push(buffer);
          }
        } else if (Buffer.isBuffer(blobData)) {
          // If it's already a Buffer
          pdfBuffers.push(blobData);
        } else {
          console.warn('Unexpected data type for BLOB column');
        }
      }

      return pdfBuffers;
    } catch (error) {
      console.error('Error retrieving PDF BLOB data:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }

  async getPdfBlobWithMetadata(
    tableName: string, 
    blobColumnName: string, 
    idColumnName: string,
    whereClause?: string
  ): Promise<Array<{ id: any; pdfBuffer: Buffer; supplierCode?: string; month?: number; supplierInvoiceNum?: string }>> {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    let connection: oracledb.Connection | undefined;
    try {
      connection = await this.pool.getConnection();
      
      // Query to get only one row per supplier using ROW_NUMBER()
      let query = `SELECT * FROM (
        SELECT * FROM (
          SELECT ia.${idColumnName}, ia.${blobColumnName}, s.CODE as supplier_code,
                 EXTRACT(MONTH FROM i.INVOICE_DATE) as invoice_month,
                 i.SUPPLIER_IV_NUM as supplier_invoice_num,
                 ROW_NUMBER() OVER (PARTITION BY s.CODE ORDER BY i.INVOICE_DATE DESC) as rn
          FROM ${tableName} ia
          JOIN INVOICES i ON ia.INVOICE_ID = i.ID
          JOIN SUPPLIERS s ON i.SUPPLIER_ID = s.ID
          ${whereClause ? `WHERE ${whereClause}` : ''}
        ) WHERE rn = 1
      )`;

      console.log(`Executing query: ${query}`);
      
      const result = await connection.execute(query, [], {
        outFormat: oracledb.OUT_FORMAT_ARRAY
      });
      
      if (!result.rows || result.rows.length === 0) {
        console.log('No rows found');
        return [];
      }

      const pdfData: Array<{ id: any; pdfBuffer: Buffer; supplierCode?: string; month?: number; supplierInvoiceNum?: string }> = [];
      
      for (const row of result.rows) {
        const rowArray = row as any[];
        const id = rowArray[0];
        const blobData = rowArray[1] as oracledb.Lob;
        const supplierCode = rowArray[2] as string;
        const month = rowArray[3] as number;
        const supplierInvoiceNum = rowArray[4] as string;
        
        if (blobData && typeof blobData.getData === 'function') {
          const buffer = await blobData.getData();
          if (Buffer.isBuffer(buffer)) {
            pdfData.push({ 
              id, 
              pdfBuffer: buffer, 
              supplierCode, 
              month, 
              supplierInvoiceNum 
            });
          }
        } else if (Buffer.isBuffer(blobData)) {
          pdfData.push({ 
            id, 
            pdfBuffer: blobData, 
            supplierCode, 
            month, 
            supplierInvoiceNum 
          });
        } else {
          console.warn(`Unexpected data type for BLOB column in row with ID: ${id}`);
        }
      }

      return pdfData;
    } catch (error) {
      console.error('Error retrieving PDF BLOB data with metadata:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  }
}
