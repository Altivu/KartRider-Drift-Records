// Create the client
import pg from 'pg';
import * as dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT
});

export default pool;