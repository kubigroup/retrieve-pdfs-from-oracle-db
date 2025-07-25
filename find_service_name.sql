-- Query to find Oracle service names and database information
-- Run these queries in SQL Developer, SQL*Plus, or your Oracle Apex SQL Workshop

-- 1. Get database name and instance
SELECT name FROM v$database;
SELECT instance_name FROM v$instance;

-- 2. Get all available services
SELECT service_name FROM v$services WHERE service_name NOT LIKE 'SYS%';

-- 3. Get database version and edition
SELECT banner FROM v$version WHERE rownum = 1;

-- 4. Get current database connection info (if connected)
SELECT sys_context('USERENV', 'DB_NAME') as db_name,
       sys_context('USERENV', 'INSTANCE_NAME') as instance_name,
       sys_context('USERENV', 'SERVICE_NAME') as service_name
FROM dual;

-- 5. For Oracle 12c+ with PDBs (Pluggable Databases)
SELECT name, con_id FROM v$pdbs;
