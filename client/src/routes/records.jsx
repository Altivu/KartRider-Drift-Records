import { useEffect, useState, useRef } from "react";
import { Form, useLoaderData, NavLink, useOutletContext, useRouteLoaderData } from "react-router-dom";

import {
  Box,
  Text,
  Button,
  useDisclosure,
  Heading,
  Grid,
  GridItem,
  Flex,
  Spacer,
  Link as ChakraLink,
  Table, TableContainer, Thead, Tr, Th, Td, Tbody,
  IconButton,
  HStack,
  Tooltip,
} from '@chakra-ui/react'

import { BiArrowBack, BiEdit } from 'react-icons/bi';
import { BsYoutube } from 'react-icons/bs';
import { RiBilibiliFill, RiAddFill, RiDeleteBin6Line } from 'react-icons/ri';
import { RxVideo } from 'react-icons/rx';

import AddEditRecord from '../components/AddEditRecord'

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

export async function loader({ params }) {
  const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tracks/${params.trackID}`);

  return response.json();
}

export default function Records() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const trackData = useLoaderData();
  const rootData = useRouteLoaderData("root");

  const [sortOptions, setSortOptions] = useState({
    column: null,
    order: null
  });

  const addEditRecordRef = useRef(null);

  // For Edit Record if applicable
  const [recordToEdit, setRecordToEdit] = useState(null);

  const COLUMNS = [
    { field: "Record", columnName: "Record" },
    { field: "Player", columnName: "Player" },
    { field: "Date", columnName: "Date" },
    { field: "Actions", columnName: "Actions" },
  ];

  // Testing setting background image
  // const detailRef = useOutletContext()?.current;

  // console.log(detailRef)

  // if (detailRef) {
  //   detailRef.style.backgroundImage = `url('https://github.com/Altivu/KRD-ui/blob/main/Track/Loading/${trackData.InternalID}.png?raw=true')`;
  // }

  // Set season description on relase date column
  trackData.Records.forEach(record => {
    // Get the season AFTER the track's season due to date comparator logic
    let indexOfSeasonOfRecord = rootData.seasons.findIndex(s => new Date(s.Date) > new Date(record.Date));

    if (indexOfSeasonOfRecord === -1) indexOfSeasonOfRecord = rootData.seasons.length;

    record.seasonOfRecord = rootData.seasons[indexOfSeasonOfRecord - 1].Description;
  });

  const updateSortOptions = (column) => {
    if (["Actions"].includes(column)) return;

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

    performSort(column);
  }

  const performSort = (column) => {
    const sorter = (a, b) => {
      switch (column) {
        case "Record": return a.Record.localeCompare(b.Record);
        case "Player": return a.Player.localeCompare(b.Player) || a.Record.localeCompare(b.Record);
        case "Date": return new Date(a.Date).toISOString().split('T')[0].localeCompare(new Date(b.Date).toISOString().split('T')[0]) || array.sort((a, b) => (a.Record).localeCompare(b.Record));
      }
    }

    trackData.Records.sort((a, b) => {
      if (!sortOptions.order) return a.ID - b.ID;
      else if (sortOptions.order === "Asc") return sorter(a, b);
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

  const getVideoIcon = (videoURL) => {
    let videoIcon = <RxVideo />;

    if (videoURL?.includes("youtube") || videoURL?.includes("youtu.be")) videoIcon = <BsYoutube />;
    else if (videoURL?.includes("bilibili")) videoIcon = <RiBilibiliFill />;

    return videoIcon;
  }

  const setAddEditRecordModalData = (record) => {
    console.log("opening...")
    console.log(addEditRecordRef.current)

    // addEditRecordRef.current.setRecord(record.Record);

    // const [recordType, setRecordType] = useState(1);
    // const [record, setRecord] = useState("");
    // const [date, setDate] = useState("");
    // const [player, setPlayer] = useState("");
    // const [video, setVideo] = useState("");

    // const [region, setRegion] = useState("");
    // const [kart, setKart] = useState("");
    // const [racer, setRacer] = useState("");
    // const [controlType, setControlType] = useState(null);
    // const [controlTypeOther, setControlTypeOther] = useState("");
  }

  return (
    <div id="recordsComponent">
      <Text><NavLink to="../tracks" style={{ display: "flex", alignItems: "center" }}><BiArrowBack /> Return to Tracks List</NavLink></Text>

      <Flex alignItems={"center"}>
        <Heading as='h3' size='lg' mt={4} mb={2}>Records for {trackData.Name}</Heading>
        <Spacer />
        <Button onClick={onOpen}>Add Record</Button>
      </Flex>
      {
        trackData.Records.length ?
          // <RecordsTableComponent />
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  {COLUMNS.map((column, index) => <Th
                    key={index}>
                    <HStack>
                      <Text fontSize='md' style={{ cursor: !["Actions"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                      {getSortIcon(column.field)}
                    </HStack>
                  </Th>)}
                </Tr>
              </Thead>
              <Tbody>
                {
                  trackData.Records.map(record => {
                    return (<Tr key={record.ID}>
                      <Td>{record.Record}</Td>
                      <Td>{record.Player}</Td>
                      <Td><Tooltip label={record.seasonOfRecord}>{new Date(record.Date).toISOString().split('T')[0]}</Tooltip></Td>
                      <Td>
                        {record.Video ? <ChakraLink href={record.Video} target="_blank" title="Watch Video"><IconButton aria-label="Watch Video" icon={getVideoIcon(record.Video)} /></ChakraLink> : <></>}
                        <IconButton aria-label="Edit Record" icon={<BiEdit />} onClick={() => {
                          setRecordToEdit(record);
                          onOpen();
                        }} />
                        <IconButton aria-label="Delete Record" icon={<RiDeleteBin6Line />} />
                      </Td>
                    </Tr>)
                  })
                }
              </Tbody>
            </Table>
          </TableContainer>
          :
          <i>No records</i>
      }

      <AddEditRecord
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        rootData={rootData}
        trackData={trackData}
        sortOptions={sortOptions}
        performSort={performSort}
        recordToEdit={recordToEdit}
        setRecordToEdit={setRecordToEdit}
      />
    </div>
  );
}