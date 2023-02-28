// Create the client
import pg from 'pg';

// const client = new pg.Client({
//     host: "localhost",
//     user: "postgres",
//     port: 5432,
//     password: "root",
//     database: "postgres"
// });

// client.connect();

// client.query("SELECT * FROM TRACKS", (err, res) => {
//     if (!err) {
//         console.log(res.rows);
//     } else {
//         console.log(err);
//     }

//     client.end;
// });

const pool = new pg.Pool({
    user: "postgres",
    password: "root",
    host: "localhost",
    database: "postgres",
    port: 5432
});

module.exports = pool;