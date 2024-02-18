\echo 'Delete and recreate dreamhost db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE dreamhost;
CREATE DATABASE dreamhost;
\connect dreamhost

\i dreamhost-schema.sql

\echo 'Delete and recreate dreamhost_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE dreamhost_test;
CREATE DATABASE dreamhost_test;
\connect dreamhost_test

\i dreamhost-schema.sql
