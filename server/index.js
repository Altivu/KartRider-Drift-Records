// https://blog.logrocket.com/getting-started-with-postgres-in-your-react-app/

import express from "express";
import cors from "cors";
import pool from "./database.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Hello world");
})

//#region Tracks Requests
app.get("/tracks", async (req, res) => {
    try {
        // Get tracks as standard, but also get the count of records per track, as well as the fastest record information
        pool.query(`SELECT *
        FROM TRACKS
        LEFT JOIN
            (SELECT DISTINCT ON ("TrackID") "TrackID",
                    "Record",
                    "Player",
                    "Video",
                    "Date" AS "TopRecordDate",
                    COUNT("TrackID") OVER (PARTITION BY "TrackID") AS "NumberOfRecords"
                FROM RECORDS
                ORDER BY "TrackID",
                    "Record") "ParsedRecords" ON "ParsedRecords"."TrackID" = TRACKS."ID"
        ORDER BY "ID";`, (error, results) => {
            if (error) throw error;

            return res.json(results.rows.sort((a, b) => a.ListOrder - b.ListOrder));
        });
    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

//#endregion Tracks Requests

//#region Records Requests

// Get All Records
app.get("/records", async (_, res) => {
    try {
        return res.json(await pool.query("SELECT * FROM records;"));
    } catch (err) {
        console.error(err.message);
    }
});

// Get Records By (EN) Track Name
app.get("/tracks/:trackName", async (req, res) => {
    try {
        let { trackName } = req.params;

        const trackInfo = (await pool.query("SELECT * FROM tracks WHERE \"Name\" = $1", [trackName])).rows[0];
        const records = (await pool.query("SELECT * FROM records WHERE \"TrackID\" = (SELECT \"ID\" FROM tracks WHERE \"Name\" = $1) ORDER BY \"Record\";", [trackName])).rows;

        return res.json({
            ID: trackInfo.ID,
            Name: trackInfo.Name,
            InternalID: trackInfo.InternalID,
            Records: records
        });
    } catch (err) {
        console.error(err.message);
    }
});

// Add New Record
app.post("/records", async (req, res) => {
    try {
        console.log(req.body);

        // I'm in hell
        const query = `INSERT INTO records (${Object.keys(req.body).map(item => `"${item}"`).join(", ")}) VALUES 
        (${Array.from({ length: Object.keys(req.body).length }, (_, i) => i + 1).map(i => `$${i}`).join(", ")})`;

        console.log(query)

        const values = Object.values(req.body);

        console.log(values)
        pool.query(query, values, (error, _) => {
            if (error) throw error;

            return res.send("Record successfully added.");
        });
    } catch (err) {
        console.error(err.message);
    }
});

// Update Record
app.put("/records/:id", async (req, res) => {
    try {
        const { record, date, video, player, region, kart, racer, submittedBy, bDisplay } = req.params;
        const { description } = req.body;

        return res.json(await pool.query("UPDATE records SET Record = ${1} WHERE TrackID = $1;", [trackID]));
    } catch (err) {
        console.error(err.message);
    }
});

// // Delete Record not required for now
// app.delete("/records/:id", async (req, res) => {
//     try {
//         const { id } = req.params;

//         return res.json(await pool.query("DELETE FROM records WHERE ID = $1;", [id]));
//     } catch (err) {
//         console.error(err.message);
//     }
// });

//#endregion Records Requests
///


app.post("/records", async (req, res) => {
    try {
        console.log(req.body);

        const newRecord = await pool.query("INSERT INTO records () VALUES($1) RETURNING *", [record]);

        res.json(newRecord.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

//#region Seasons Requests

app.get("/seasons", async (_, res) => {
    try {
        return res.json((await pool.query("SELECT * FROM seasons;")).rows);
    } catch (err) {
        console.error(err.message);
    }
});

//#endregion Seasons Requests

//#region Languages Requests

app.get("/languages", async (_, res) => {
    try {
        return res.json((await pool.query("SELECT * FROM languages;")).rows);
    } catch (err) {
        console.error(err.message);
    }
});

//#endregion Languages Requests

//#region Countries Requests

app.get("/countries", async (_, res) => {
    try {
        return res.json((await pool.query('SELECT * FROM countries ORDER BY "Code";')).rows);
    } catch (err) {
        console.error(err.message);
    }
});

//#endregion Countries Requests

app.listen(PORT, () => {
    console.log(`Running on Port ${PORT}`);
});

// Get tracks
