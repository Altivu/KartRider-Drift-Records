import * as React from 'react';
import { Form, useLoaderData, NavLink } from "react-router-dom";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort, SortToggleType } from '@table-library/react-table-library/sort';

export async function loader({ params }) {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tracks`);

    console.log(response)

    return response.json();
}

const LICENSE_ORDER = ["None", "B3", "B2", "B1", "L3", "L2", "L1", "Pro"];

const COLUMNS = [
    { label: 'Name', renderCell: (item) => item.Name, sort: { sortKey: 'NAME' }, resize: true },
    { label: 'Theme', renderCell: (item) => item.Theme, sort: { sortKey: 'THEME' }, resize: true },
    { label: 'License', renderCell: (item) => getLicenseField(item.License), sort: { sortKey: 'LICENSE' }, resize: true },
    { label: 'Difficulty', renderCell: (item) => <DifficultyComponent difficulty={item.Difficulty}></DifficultyComponent>, sort: { sortKey: 'DIFFICULTY' }, resize: true },
    { label: 'Laps', renderCell: (item) => item.Laps },
    { label: 'Item Mode?', renderCell: (item) => item.BItemMode ? "✓" : "", sort: { sortKey: 'BITEMMODE' }, resize: true },
    { label: 'Release Date', renderCell: (item) => new Date(item.ReleaseDate).toISOString().split('T')[0], sort: { sortKey: 'RELEASEDATE' }, resize: true },
    {
        label: 'Records', renderCell: (item) =>
        (<NavLink to={`${item.ID}`}>
            <button>View</button>
        </NavLink>)
        , resize: true
    }
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
            sortIcon: {
                size: '10px',
            },
            sortToggleType: SortToggleType.AlternateWithReset,
            sortFns: {
                NAME: (array) => array.sort((a, b) => a.Name.localeCompare(b.Name)),
                THEME: (array) => array.sort((a, b) => a.Theme.localeCompare(b.Theme) || a.Name.localeCompare(b.Name)),
                LICENSE: (array) => array.sort((a, b) => {
                    try {
                        return ((LICENSE_ORDER.indexOf(a.License) - LICENSE_ORDER.indexOf(b.License)) || a.Name.localeCompare(b.Name));
                    }
                    catch {
                        return 0;
                    }
                }),
                DIFFICULTY: (array) => array.sort((a, b) => a.Difficulty - b.Difficulty || a.Name.localeCompare(b.Name)),
                LAPS: (array) => array.sort((a, b) => a.Laps - b.Laps || a.Name.localeCompare(b.Name)),
                BITEMMODE: (array) => array.sort((a, b) => {
                    if (a.BItemMode && !b.BItemMode) return -1;
                    else if (!a.BItemMode && b.BItemMode) return 1;
                    else return a.Name.localeCompare(b.Name)
                }),
                RELEASEDATE: (array) => array.sort((a, b) => new Date(a.ReleaseDate).toISOString().split('T')[0].localeCompare(new Date(b.ReleaseDate).toISOString().split('T')[0]) || a.Name.localeCompare(b.Name))
            }
        },
    );

    function onSortChange(action, state) {
        // console.log(action, state);
    }

    return <CompactTable columns={COLUMNS} data={{ nodes }} theme={theme} sort={sort} layout={{ fixedHeader: true }} />;
};

const getLicenseField = license => {
    return license !== "None" ? <img src={getLicenseImage(license)} alt={license} className="licenseImage"></img> : "None"
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
            <h1>Tracks</h1>
            <TracksTableComponent />
        </>
    );
}