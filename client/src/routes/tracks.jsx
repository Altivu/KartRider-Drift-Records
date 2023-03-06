import * as React from 'react';
import { Form, useLoaderData } from "react-router-dom";
import { getContact } from "../contacts";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort, SortToggleType } from '@table-library/react-table-library/sort';

export async function loader({ params }) {
    const response = await fetch("http://localhost:3000/tracks");

    return response.json();
}

const COLUMNS = [
    { label: 'Name', renderCell: (item) => getTrackName(item.Name), sort: { sortKey: 'NAME' } },
    { label: 'Theme', renderCell: (item) => getTrackTheme(item.Name), sort: { sortKey: 'THEME' } },
    // { label: 'Task', renderCell: (item) => item.name },
    // {
    //   label: 'Deadline',
    //   renderCell: (item) =>
    //     item.deadline.toLocaleDateString('en-US', {
    //       year: 'numeric',
    //       month: '2-digit',
    //       day: '2-digit',
    //     }),
    // },
    // { label: 'Type', renderCell: (item) => item.type },
    // {
    //   label: 'Complete',
    //   renderCell: (item) => item.isComplete.toString(),
    // },
    // { label: 'Tasks', renderCell: (item) => item.nodes },
];

const TracksTableComponent = () => {
    const tracks = useLoaderData();

    // It seems like it is mandatory for this variable to be named "nodes" to be read by data for react-table-library?
    // Also it forces "id" for key prop...
    const nodes = tracks;
    nodes.forEach(track => {
        track.id = track.ID;
    });

    const theme = useTheme(getTheme());

    const sort = useSort(
        nodes,
        {
            onChange: onSortChange,
        },
        {
            sortToggleType: SortToggleType.AlternateWithReset,
            sortFns: {
                NAME: (array) => array.sort((a, b) => getTrackName(a.Name).localeCompare(getTrackName(b.Name))),
                THEME: (array) => array.sort((a, b) => {
                    if (getTrackTheme(a.Name).localeCompare(getTrackTheme(b.Name) == 0)) {
                        return array.sort((a, b) => getTrackName(a.Name).localeCompare(getTrackName(b.Name)));
                    } else {
                        return getTrackTheme(a.Name).localeCompare(getTrackTheme(b.Name));
                    }
                })
                // THEME: (array) => array.sort((a, b) => getTrackTheme(a.Name).localeCompare(getTrackTheme(b.Name))),
            }
        },
    );

    function onSortChange(action, state) {
        console.log(action, state);
    }

    return <CompactTable columns={COLUMNS} data={{ nodes }} theme={theme} sort={sort} />;
};

const getTrackName = name => {
    return name?.split(":")[1]?.trim();
}

const getTrackTheme = name => {
    return name?.split(":")[0];
}

const getLicenseImage = license => {
    return `${import.meta.env.VITE_ASSETS_GITHUB_URL}/Common/_Res/Sprites/License_${license}_Simple.png`;
}

const DifficultyComponent = props => {
    return (
        <>
            {Array.from({ length: 5 }, (_, i) => i + 1).map(i =>
                <img
                    key={i}
                    src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/Common/_Res/Sprites/ic_DifficultyCircle${i <= props.difficulty ? "" : "_white"}.png`}
                    className="difficultyImage" />)}
        </>
    );
}

export default function Tracks() {
    const tracks = useLoaderData();

    return (
        <>
            <p id="zero-state">
                This is a demo for React Router.
                <br />
                Check out{" "}
                <a href="https://reactrouter.com">
                    the docs at reactrouter.com
                </a>
                .
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Theme</th>
                        <th>License</th>
                        <th>Difficulty</th>
                        <th>Laps</th>
                        <th>Item Mode?</th>
                        <th>Release Date</th>
                        <th>Records</th>
                    </tr>
                </thead>
                <tbody>
                    {tracks.map(track => (
                        <tr key={track.ID}>
                            <td>{track.Name?.split(":")[1]?.trim()}</td>
                            <td>{track.Name?.split(":")[0]}</td>
                            <td>{track.License !== "None" ? <img src={getLicenseImage(track.License)} alt={track.License} className="licenseImage"></img> : "None"}</td>
                            <td>
                                <DifficultyComponent difficulty={track.Difficulty}></DifficultyComponent>
                                {/* {getDifficulty(track.Difficulty)} */}
                            </td>
                            <td>TBD</td>
                            <td>{track.BItemMode ? "✓" : ""}</td>
                            <td>{new Date(track.ReleaseDate).toISOString().split('T')[0]}</td>
                            <td>TBD</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* <TracksTableComponent/> */}

            <TracksTableComponent />
        </>
    );
}