import { PdfRetriever } from './pdf-retriever.js';
import fs from 'fs';
async function main(): Promise<void> {
  const invoiceCodesFilePath = process.argv[2];
  const invoiceAttachmentDescription = process.argv[3];
  const retriever = new PdfRetriever();

  try {
    console.log('🚀 Starting PDF retrieval from Oracle database...');
    await retriever.initialize();
    console.log('✅ Database connection established');

    // Get the JSON file path from CLI
    if (!invoiceCodesFilePath) {
      console.error('Please provide a path to the invoice codes JSON file as the first argument.');
      process.exit(1);
    }

    let invoiceCodes: string[] = [];
    try {
      const fileContent = fs.readFileSync(invoiceCodesFilePath, 'utf-8');
      invoiceCodes = JSON.parse(fileContent);
      if (!Array.isArray(invoiceCodes) || !invoiceCodes.every(code => typeof code === 'string')) {
        throw new Error('JSON file must contain an array of strings.');
      }
    } catch (err) {
      console.error('Failed to read or parse the invoice codes JSON file:', err);
      process.exit(1);
    }

  const savedFiles = await retriever.retrievePdfs(invoiceCodes, invoiceAttachmentDescription);

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
