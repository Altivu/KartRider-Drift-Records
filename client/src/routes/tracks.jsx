import { useState, useEffect } from 'react';
import { Form, useLoaderData, NavLink, useRouteLoaderData } from "react-router-dom";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort, SortToggleType } from '@table-library/react-table-library/sort';
import { Button, Heading, Table, TableContainer, Td, Thead, Tbody, Tr, Image, HStack, Tooltip, Th, Text, Link as ChakraLink } from '@chakra-ui/react';

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

export async function loader({ params }) {
    try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tracks`);

        return response.json();
    }
    catch {
        return [];
    }
}

const LICENSE_ORDER = ["None", "B3", "B2", "B1", "L3", "L2", "L1", "Pro"];

// const COLUMNS = [
//     {
//         label: '', renderCell: (item) => {
//             if (item.InternalID) return <img src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/Track/MiniMap/SDF_Minimap_${item.InternalID}.png`} className="minimapImage" onError={() => { this.onerror = null; this.src = ''; }} />
//         }
//     },
//     { label: 'Name', renderCell: (item) => item.Name, sort: { sortKey: 'NAME' }, resize: true },
//     { label: 'Theme', renderCell: (item) => item.Theme, sort: { sortKey: 'THEME' }, resize: true },
//     { label: 'License', renderCell: (item) => getLicenseField(item.License), sort: { sortKey: 'LICENSE' }, resize: true },
//     { label: 'Difficulty', renderCell: (item) => <DifficultyComponent difficulty={item.Difficulty}></DifficultyComponent>, sort: { sortKey: 'DIFFICULTY' }, resize: true },
//     { label: 'Laps', renderCell: (item) => item.Laps },
//     { label: 'Item Mode?', renderCell: (item) => item.BItemMode ? "✓" : "", sort: { sortKey: 'BITEMMODE' }, resize: true },
//     { label: 'Release Date', renderCell: (item) => new Date(item.ReleaseDate).toISOString().split('T')[0], sort: { sortKey: 'RELEASEDATE' }, resize: true },
//     {
//         label: 'Records', renderCell: (item) =>
//         (<NavLink to={`${item.Name}`}>
//             <button>View</button>
//         </NavLink>)
//         , resize: true
//     }
// ];

const TracksTableComponent = () => {
    const tracks = useLoaderData();
    const rootData = useRouteLoaderData("root");

    // It seems like it is mandatory for this variable to be named "nodes" to be read by data for react-table-library?
    // Also it forces "id" for key prop...
    const nodes = tracks;
    nodes.forEach(track => {
        track.id = track.ID;
    });

    // // Update date column to include information from seasons
    // COLUMNS.find(col => col.label === 'Release Date').renderCell = (item) => {
    //     // Get the season AFTER the track's season due to date comparator logic
    //     let indexOfSeasonOfRecord = rootData.seasons.findIndex(s => new Date(s.Date) > new Date(item.ReleaseDate));

    //     if (indexOfSeasonOfRecord === -1) indexOfSeasonOfRecord = rootData.seasons.length;

    //     let seasonOfRecord = rootData.seasons[indexOfSeasonOfRecord - 1];

    //     return <span title={seasonOfRecord?.Description}>{new Date(item.ReleaseDate).toISOString().split('T')[0]}</span>;
    // }

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

    return <CompactTable data={{ nodes }} theme={theme} sort={sort} layout={{ fixedHeader: true }} />;
};

const getLicenseField = license => {
    return license !== "None" ? <Image src={getLicenseImage(license)} alt={license} className="licenseImage"></Image> : "None"
}

const getLicenseImage = license => {
    return `${import.meta.env.VITE_ASSETS_GITHUB_URL}/Common/_Res/Sprites/License_${license}_Simple.png`;
}

const DifficultyComponent = props => {
    return (
        <HStack spacing='2px'>
            {Array.from({ length: 5 }, (_, i) => i + 1).map(i =>
                <Image
                    key={i}
                    src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/Common/_Res/Sprites/ic_DifficultyCircle${i <= props.difficulty ? "" : "_white"}.png`}
                    alt="Difficulty Circle"
                    className="difficultyImage" />)}
        </HStack>
    );
}

export default function Tracks() {
    const tracks = useLoaderData();
    const rootData = useRouteLoaderData("root");

    const [sortOptions, setSortOptions] = useState({
        column: null,
        order: null
    });

    const COLUMNS = [
        { field: "InternalID", columnName: "" },
        { field: "Name", columnName: "Name" },
        { field: "Theme", columnName: "Theme" },
        { field: "License", columnName: "License" },
        { field: "Difficulty", columnName: "Difficulty" },
        { field: "Laps", columnName: "Laps" },
        { field: "BItemMode", columnName: "Item Mode?" },
        { field: "ReleaseDate", columnName: "Release Date" },
        { field: "TopSavedRecord", columnName: "Top Saved Record" },
        { field: "Records", columnName: "Records" }
    ];

    // Set season description on relase date column
    tracks.forEach(track => {
        // Get the season AFTER the track's season due to date comparator logic
        let indexOfSeasonOfRecord = rootData.seasons.findIndex(s => new Date(s.Date) > new Date(track.ReleaseDate));

        if (indexOfSeasonOfRecord === -1) indexOfSeasonOfRecord = rootData.seasons.length;

        track.seasonOfRecord = rootData.seasons[indexOfSeasonOfRecord - 1].Description;
    });

    const updateSortOptions = (column) => {
        if (["InternalID", "Records"].includes(column)) return;

        let order = sortOptions.order;

        if (column !== sortOptions.column) order = "Asc";
        else {
            if (order === "Asc") order = "Desc";
            else if (order === "Desc") order = null;
            else if (order === null) order = "Asc";
        }
        setSortOptions({
            column,
            order
        });

        const sorter = (a, b) => {
            switch (column) {
                case "Name": return a.Name.localeCompare(b.Name);
                case "Theme": return a.Theme.localeCompare(b.Theme) || a.Name.localeCompare(b.Name);
                case "License": {
                    try {
                        return ((LICENSE_ORDER.indexOf(a.License) - LICENSE_ORDER.indexOf(b.License)) || a.Name.localeCompare(b.Name));
                    }
                    catch {
                        return 0;
                    }
                }
                case "Difficulty": return a.Difficulty - b.Difficulty || a.Name.localeCompare(b.Name);
                case "Laps": return a.Laps - b.Laps || a.Name.localeCompare(b.Name);
                case "BItemMode": {
                    if (a.BItemMode && !b.BItemMode) return -1;
                    else if (!a.BItemMode && b.BItemMode) return 1;
                    else return a.Name.localeCompare(b.Name)
                }
                case "ReleaseDate": return new Date(a.ReleaseDate).toISOString().split('T')[0].localeCompare(new Date(b.ReleaseDate).toISOString().split('T')[0]) || a.Name.localeCompare(b.Name)
            }
        }

        tracks.sort((a, b) => {
            if (!order) return a.ID - b.ID;
            else if (order === "Asc") return sorter(a, b);
            else return sorter(b, a);
        });
    }

    const getSortIcon = (column) => {
        if (["InternalID", "Records"].includes(column)) return <></>;

        if (sortOptions.column === column) {
            switch (sortOptions.order) {
                case "Asc": return <FaSortUp />;
                case "Desc": return <FaSortDown />;
                case null:
                default: return <FaSort />;
            }
        } else {
            return <FaSort />;
        }
    }

    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Tracks</Heading>
            {/* {tracks.length ? <TracksTableComponent /> : <i>Could not retrieve tracks information...</i>} */}

            <TableContainer>
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            {COLUMNS.map((column, index) => <Th
                                key={index}>
                                <HStack>
                                    <Text fontSize='md' style={{ cursor: !["InternalID", "Records"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                                    {getSortIcon(column.field)}
                                </HStack>
                            </Th>)}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            tracks.map(track => {
                                return (<Tr key={track.ID}>
                                    <Td><Image
                                        src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/Track/MiniMap/SDF_Minimap_${track.InternalID}.png`}
                                        alt={track.Name}
                                        boxSize="100px"
                                        objectFit="contain"
                                        className="minimapImage"
                                        fallbackSrc='https://dummyimage.com/100' /></Td>
                                    <Td>{track.Name}</Td>
                                    <Td>{track.Theme}</Td>
                                    <Td>{getLicenseField(track.License)}</Td>
                                    <Td><DifficultyComponent difficulty={track.Difficulty}></DifficultyComponent></Td>
                                    <Td>{track.Laps}</Td>
                                    <Td>{track.BItemMode ? "✓" : ""}</Td>
                                    <Td><Tooltip label={track.seasonOfRecord}>{new Date(track.ReleaseDate).toISOString().split('T')[0]}</Tooltip></Td>
                                    <Td>{track.Record ? <Tooltip label={`by ${track.Player}`}><ChakraLink href={track.Video} isExternal>{track.Record}</ChakraLink></Tooltip> : "--:--.---"}</Td>
                                    <Td>
                                        <NavLink to={`${track.Name}`}>
                                            <Button>View ({track.NumberOfRecords || 0})</Button>
                                        </NavLink>
                                    </Td>
                                </Tr>)
                            })
                        }
                    </Tbody>
                </Table>
            </TableContainer>


        </>
    );
}