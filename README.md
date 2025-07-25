# PDF Retrieval from Oracle Database

A TypeScript application that connects to an Oracle (Apex) database and retrieves PDF files stored as BLOB data, converting them to actual PDF files on disk.

## Features

- ✅ TypeScript with ESM modules
- ✅ Oracle Database connectivity using `oracledb`
- ✅ BLOB to PDF conversion
- ✅ Connection pooling for better performance
- ✅ PDF validation before saving
- ✅ Flexible querying with WHERE clauses
- ✅ Error handling and logging
- ✅ Environment-based configuration

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **Oracle Instant Client** - Required for the `oracledb` driver
3. **Oracle Database** with BLOB columns containing PDF data

### Installing Oracle Instant Client

#### Windows
1. Download Oracle Instant Client from [Oracle's website](https://www.oracle.com/database/technologies/instant-client/downloads.html)
2. Extract to a directory (e.g., `C:\instantclient_21_3`)
3. Add the directory to your `PATH` environment variable

#### Linux/macOS
```bash
# Using package manager (recommended)
# For Ubuntu/Debian:
sudo apt-get install libaio1 wget unzip
wget https://download.oracle.com/otn_software/linux/instantclient/213000/instantclient-basic-linux.x64-21.3.0.0.0.zip
unzip instantclient-basic-linux.x64-21.3.0.0.0.zip
sudo mv instantclient_21_3 /opt/oracle/
export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_3:$LD_LIBRARY_PATH
```

## Installation

1. **Clone or create the project:**
   ```bash
   cd retrieve-pdfs-from-oracle-db
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment configuration:**
   ```bash
   cp .env.example .env
   ```

4. **Edit the `.env` file with your database credentials:**
   ```env
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_CONNECT_STRING=your_host:1521/your_service_name
   PDF_OUTPUT_DIR=./output
   ```

## Usage

### Basic Usage

1. **Configure the database details in `src/index.ts`:**
   ```typescript
   const CONFIG = {
     tableName: 'YOUR_TABLE_NAME',           // Replace with your table name
     blobColumnName: 'YOUR_BLOB_COLUMN',     // Replace with your BLOB column name
     idColumnName: 'ID',                     // Replace with your ID column name (optional)
     whereClause: undefined,                 // Add WHERE conditions if needed
     outputFilenamePrefix: 'extracted_pdf'   // Prefix for saved PDF files
   };
   ```

2. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

### Advanced Usage

You can also use the `PdfRetriever` class programmatically:

```typescript
import { PdfRetriever } from './pdf-retriever.js';

const retriever = new PdfRetriever();

try {
  await retriever.initialize();
  
  const savedFiles = await retriever.retrievePdfs({
    tableName: 'DOCUMENTS',
    blobColumnName: 'PDF_DATA',
    idColumnName: 'DOC_ID',
    whereClause: "CREATED_DATE >= SYSDATE - 30", // Last 30 days
    outputFilenamePrefix: 'document'
  });
  
  console.log('Saved files:', savedFiles);
} finally {
  await retriever.close();
}
```

## Project Structure

```
├── src/
│   ├── config.ts           # Configuration management
│   ├── database.ts         # Database service for Oracle connectivity
│   ├── pdf-service.ts      # PDF handling and file operations
│   ├── pdf-retriever.ts    # Main retrieval logic
│   └── index.ts           # Application entry point
├── output/                 # Directory for saved PDF files
├── .env.example           # Environment variables template
├── .env                   # Your environment variables (create this)
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_USER` | Oracle database username | `myuser` |
| `DB_PASSWORD` | Oracle database password | `mypassword` |
| `DB_CONNECT_STRING` | Oracle connection string | `localhost:1521/XEPDB1` |
| `PDF_OUTPUT_DIR` | Directory to save PDF files | `./output` |
| `DB_POOL_MIN` | Minimum pool connections | `1` |
| `DB_POOL_MAX` | Maximum pool connections | `10` |
| `DB_POOL_INCREMENT` | Pool increment size | `1` |

### Retrieval Options

| Option | Type | Description |
|--------|------|-------------|
| `tableName` | string | Name of the table containing BLOB data |
| `blobColumnName` | string | Name of the BLOB column containing PDF data |
| `idColumnName` | string (optional) | ID column for better file naming |
| `whereClause` | string (optional) | SQL WHERE clause to filter records |
| `outputFilenamePrefix` | string (optional) | Prefix for saved PDF filenames |

## Error Handling

The application includes comprehensive error handling:

- **Database connection errors** - Check your connection string and credentials
- **Invalid PDF data** - PDFs are validated before saving
- **File system errors** - Output directory is created automatically
- **SQL errors** - Detailed Oracle error messages are displayed

## Common Issues

### ORA-12154: TNS:could not resolve the connect identifier specified
- Check your `DB_CONNECT_STRING` format
- Ensure Oracle Instant Client is properly installed
- Verify the service name or SID

### ORA-00942: table or view does not exist
- Verify the table name and column names
- Check user permissions to access the table

### PDF files are corrupted or empty
- Ensure the BLOB column actually contains PDF data
- Check if the data needs to be decoded (e.g., Base64)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues related to:
- **Oracle connectivity**: Check Oracle documentation and `oracledb` npm package
- **PDF processing**: Verify your BLOB data contains valid PDF content
- **TypeScript/Node.js**: Ensure you're using compatible versions

## Examples

### Example 1: Retrieve all PDFs from a documents table
```typescript
await retriever.retrievePdfs({
  tableName: 'DOCUMENTS',
  blobColumnName: 'DOCUMENT_DATA',
  idColumnName: 'DOCUMENT_ID',
  outputFilenamePrefix: 'doc'
});
```

### Example 2: Retrieve PDFs with date filter
```typescript
await retriever.retrievePdfs({
  tableName: 'REPORTS',
  blobColumnName: 'REPORT_PDF',
  idColumnName: 'REPORT_ID',
  whereClause: "CREATED_DATE >= TRUNC(SYSDATE) - 7", // Last 7 days
  outputFilenamePrefix: 'weekly_report'
});
```

### Example 3: Retrieve specific PDFs by ID
```typescript
await retriever.retrievePdfs({
  tableName: 'INVOICES',
  blobColumnName: 'INVOICE_PDF',
  idColumnName: 'INVOICE_ID',
  whereClause: "INVOICE_ID IN (1001, 1002, 1003)",
  outputFilenamePrefix: 'invoice'
});
```
