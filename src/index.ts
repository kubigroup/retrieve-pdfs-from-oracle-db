import { PdfRetriever } from './pdf-retriever.js';

async function main(): Promise<void> {
  // Example configuration - modify these values according to your database schema
  const CONFIG = {
    tableName: 'INVOICE_ATTACHMENTS',           // Replace with your table name
    blobColumnName: 'BLOB_CONTENT',     // Replace with your BLOB column name
    idColumnName: 'ID',                     // Replace with your ID column name (optional)
    whereClause: `EXTRACT(YEAR FROM i.INVOICE_DATE) = 2025`,                 // Filter by supplier codes and year 2025
    outputFilenamePrefix: 'extracted_pdf'   // Prefix for saved PDF files (fallback only)
  };

  const retriever = new PdfRetriever();

  try {
    console.log('🚀 Starting PDF retrieval from Oracle database...');

    // Initialize database connection
    await retriever.initialize();
    console.log('✅ Database connection established');

    // Retrieve and save PDFs
    const savedFiles = await retriever.retrievePdfs(CONFIG);

    if (savedFiles.length > 0) {
      console.log(`✅ Successfully saved ${savedFiles.length} PDF file(s):`);
      savedFiles.forEach((filePath, index) => {
        console.log(`   ${index + 1}. ${filePath}`);
      });
    } else {
      console.log('ℹ️  No PDF files were found or saved');
    }

  } catch (error) {
    console.error('❌ Error occurred:', error);

    if (error instanceof Error) {
      if (error.message.includes('Missing required database configuration')) {
        console.log('\n📝 Please ensure you have:');
        console.log('   1. Created a .env file based on .env.example');
        console.log('   2. Set the correct database connection details');
      } else if (error.message.includes('ORA-')) {
        console.log('\n📝 Database error occurred. Please check:');
        console.log('   1. Database connection details are correct');
        console.log('   2. Table and column names exist');
        console.log('   3. User has proper permissions');
      }
    }

    process.exit(1);
  } finally {
    // Clean up database connection
    await retriever.close();
    console.log('🔐 Database connection closed');
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
