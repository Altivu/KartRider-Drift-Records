import { useEffect, useState } from "react";
import { Form, useLoaderData } from "react-router-dom";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort, SortToggleType } from '@table-library/react-table-library/sort';

import { RiBilibiliFill } from 'react-icons';

export async function loader({ params }) {
  const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tracks/${params.trackID}`);

  return response.json();
}

const COLUMNS = [
  // { label: 'Name', renderCell: (item) => getTrackName(item.Name), sort: { sortKey: 'NAME' }, resize: true },
  // { label: 'Theme', renderCell: (item) => getTrackTheme(item.Name), sort: { sortKey: 'THEME' }, resize: true },
  // { label: 'License', renderCell: (item) => getLicenseField(item.License), sort: { sortKey: 'LICENSE' }, resize: true },
  // { label: 'Difficulty', renderCell: (item) => <DifficultyComponent difficulty={item.Difficulty}></DifficultyComponent>, sort: { sortKey: 'DIFFICULTY' }, resize: true },
  // // { label: 'Laps', renderCell: (item) => item.Laps },
  // { label: 'Item Mode?', renderCell: (item) => item.BItemMode ? "✓" : "", sort: { sortKey: 'BITEMMODE' }, resize: true },
  // { label: 'Release Date', renderCell: (item) => new Date(item.ReleaseDate).toISOString().split('T')[0], sort: { sortKey: 'RELEASEDATE' }, resize: true },
  // { label: 'Records', renderCell: (item) => <button>View</button>, resize: true }

  { label: 'Record', renderCell: (item) => item.Record, sort: { sortKey: 'RECORD' } },
  { label: 'Player', renderCell: (item) => item.Player, sort: { sortKey: 'PLAYER' }},
  { label: 'Date', renderCell: (item) => new Date(item.Date).toISOString().split('T')[0], sort: { sortKey: 'DATE' }, resize: true },
  { label: '', renderCell: (item) => <button><RiBilibiliFill/></button>}
];

export default function Records() {
  const trackData = useLoaderData();

  const RecordsTableComponent = () => {
    // console.log(trackData)

    // It seems like it is mandatory for this variable to be named "nodes" to be read by data for react-table-library?
    // Also it forces "id" for key prop...
    const nodes = trackData.Records;

    // console.log(nodes)

    nodes.forEach((record, index) => {
      record.id = index;
    });

    const theme = useTheme(getTheme());

    const sort = useSort(
      nodes,
      {

      },
      {
        sortIcon: {
          size: '10px',
        },
        sortToggleType: SortToggleType.AlternateWithReset,
        sortFns: {
          RECORD: (array) => array.sort((a, b) => (a.Record).localeCompare(b.Record)),
          PLAYER: (array) => array.sort((a, b) => (a.Player).localeCompare(b.Player)),
          DATE: (array) => array.sort((a, b) => new Date(a.Date).toISOString().split('T')[0].localeCompare(new Date(b.Date).toISOString().split('T')[0]) || array.sort((a, b) => (a.Record).localeCompare(b.Record)))

          // NAME: (array) => array.sort((a, b) => getTrackName(a.Name).localeCompare(getTrackName(b.Name))),
          // THEME: (array) => array.sort((a, b) => getTrackTheme(a.Name).localeCompare(getTrackTheme(b.Name)) || getTrackName(a.Name).localeCompare(getTrackName(b.Name))),
          // LICENSE: (array) => array.sort((a, b) => {
          //   try {
          //     return ((LICENSE_ORDER.indexOf(a.License) - LICENSE_ORDER.indexOf(b.License)) || getTrackName(a.Name).localeCompare(getTrackName(b.Name)));
          //   }
          //   catch {
          //     return 0;
          //   }
          // }),
          // DIFFICULTY: (array) => array.sort((a, b) => a.Difficulty - b.Difficulty || getTrackName(a.Name).localeCompare(getTrackName(b.Name))),
          // LAPS: (array) => array.sort((a, b) => a.Laps - b.Laps || getTrackName(a.Name).localeCompare(getTrackName(b.Name))),
          // BITEMMODE: (array) => array.sort((a, b) => {
          //   if (a.BItemMode && !b.BItemMode) return -1;
          //   else if (!a.BItemMode && b.BItemMode) return 1;
          //   else return getTrackName(a.Name).localeCompare(getTrackName(b.Name))
          // }),
          // RELEASEDATE: (array) => array.sort((a, b) => new Date(a.ReleaseDate).toISOString().split('T')[0].localeCompare(new Date(b.ReleaseDate).toISOString().split('T')[0]) || getTrackName(a.Name).localeCompare(getTrackName(b.Name)))
        }
      },
    );

    return <CompactTable columns={COLUMNS} data={{ nodes }} theme={theme} sort={sort} layout={{ fixedHeader: true }} />;
  }

  return (
    <>
      <h1>Records for {trackData.Name}</h1>
      {
        trackData.Records.length ?
          <RecordsTableComponent /> :
          <i>No records</i>
      }
    </>
  );
}