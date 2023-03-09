import { useEffect, useState, useRef } from "react";
import { Form, useLoaderData, NavLink, useOutletContext, useRouteLoaderData } from "react-router-dom";

import { CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import { getTheme } from '@table-library/react-table-library/baseline';
import { useSort, SortToggleType } from '@table-library/react-table-library/sort';

import { BiArrowBack } from 'react-icons/bi';
import { BsYoutube } from 'react-icons/bs';
import { RiBilibiliFill } from 'react-icons/ri';
import { RxVideo } from 'react-icons/rx';

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
  { label: 'Player', renderCell: (item) => item.Player, sort: { sortKey: 'PLAYER' } },
  // Date column is going to be further updated by seasons information
  { label: 'Date', renderCell: (item) => new Date(item.Date).toISOString().split('T')[0], sort: { sortKey: 'DATE' }, resize: true },
  {
    label: '', renderCell: (item) => {
      let videoIcon = <RxVideo />;

      if (item.Video?.includes("youtube") || item.Video?.includes("youtu.be")) videoIcon = <BsYoutube />;
      else if (item.Video?.includes("bilibili")) videoIcon = <RiBilibiliFill />;

      return <a href={item.Video} target="_blank">{videoIcon}</a>;
    }
  }
];

export default function Records() {
  const trackData = useLoaderData();
  const rootData = useRouteLoaderData("root");

  // Testing setting background image
  // const detailRef = useOutletContext()?.current;

  // console.log(detailRef)

  // if (detailRef) {
  //   detailRef.style.backgroundImage = `url('https://github.com/Altivu/KRD-ui/blob/main/Track/Loading/${trackData.InternalID}.png?raw=true')`;
  // }

  const RecordsTableComponent = () => {
    // It seems like it is mandatory for this variable to be named "nodes" to be read by data for react-table-library?
    // Also it forces "id" for key prop...
    const nodes = trackData.Records;

    nodes.forEach((record, index) => {
      record.id = index;
    });

    // Update date column to include information from seasons
    COLUMNS.find(col => col.label === 'Date').renderCell = (item) => {
      let seasonOfRecord = rootData.seasons[rootData.seasons.findIndex(s => new Date(s.Date) > new Date(item.Date)) - 1];

      return <span title={seasonOfRecord.Description}>{new Date(item.Date).toISOString().split('T')[0]}</span>;
    }

    const theme = useTheme(getTheme());

    const sort = useSort(
      nodes,
      {
        onChange: null
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
    <div id="recordsComponent">
      <NavLink to="../tracks"><BiArrowBack /> Return to Tracks List</NavLink>
      <h1>Records for {trackData.Name}</h1>
      {
        trackData.Records.length ?
          <RecordsTableComponent /> :
          <i>No records</i>
      }
    </div>
  );
}