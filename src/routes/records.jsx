import { useState, useRef } from "react";
import { useLoaderData, NavLink, useOutletContext, useRouteLoaderData } from "react-router-dom";
import { supabase } from '../main';

import {
  Box,
  Text,
  Button,
  useDisclosure,
  Heading,
  Flex,
  Spacer,
  Table, TableContainer, Thead, Tr, Th, Td, Tbody,
  IconButton,
  HStack,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  ButtonGroup,
  useToast
} from '@chakra-ui/react'

import { BiArrowBack, BiEdit } from 'react-icons/bi';
import { BsYoutube } from 'react-icons/bs';
import { RiBilibiliFill, RiAddFill, RiDeleteBin6Line } from 'react-icons/ri';
import { RxVideo } from 'react-icons/rx';

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

import RecordModal from "../components/RecordModal";
import VideoModal from "../components/VideoModal";

export async function loader({ params }) {
  // Supabase call
  // Function in database
  /*
CREATE OR REPLACE FUNCTION public.get_track_with_records(
  trackname character varying DEFAULT NULL::character varying)
    RETURNS TABLE("ID" bigint, "InternalID" character varying, "Name" character varying, "Records" json) 
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$

SELECT *
FROM
  (SELECT TRACKS."ID",
      TRACKS."InternalID",
      TRACKS."Name",
      CASE
              WHEN COUNT(RECORDS.*) = 0 THEN '[]'
              ELSE JSON_AGG(RECORDS.* ORDER BY RECORDS."Record")
      END "Records"
    FROM TRACKS
    LEFT JOIN RECORDS ON TRACKS."ID" = RECORDS."TrackID"
    WHERE TRACKS."Name" = CASE WHEN trackName IS NOT NULL THEN trackName ELSE TRACKS."Name" END
    GROUP BY TRACKS."ID") TRACKS_WITH_RECORDS;
$BODY$;
*/

  try {
    const { data, error } = await supabase.rpc('get_track_with_records', { trackname: params.trackName });

    if (error) throw error;

    return data[0];
  }
  catch {
    return [];
  }
}

export default function Records() {
  const [_, user] = useOutletContext();
  const toast = useToast();
  const toastIdRef = useRef(null);

  // Record Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Video Modal 
  const { isOpen: isOpenVideoModal, onOpen: onOpenVideoModal, onClose: onCloseVideoModal } = useDisclosure();
  // Delete Record Popover
  // const { isOpen: isOpenDeletePopover, onOpen: onOpenDeletePopover, onClose: onCloseDeletePopover } = useDisclosure();

  // Since a page can have multiple records where the delete popover can appear, track an ID instead of a boolean
  const [deletePopover, setDeletePopover] = useState(null);

  const onOpenDeletePopover = (record) => {
    setDeletePopover(record.ID);
  }

  const onCloseDeletePopover = () => {
    setDeletePopover(null);
  }

  const trackData = useLoaderData();
  const rootData = useRouteLoaderData("root");

  const [sortOptions, setSortOptions] = useState({
    column: null,
    order: null
  });

  // For Edit Record if applicable
  const [recordToEdit, setRecordToEdit] = useState(null);

  // For View Record if applicable
  const [recordToView, setRecordToView] = useState(null);

  const COLUMNS = [
    { field: "Record", columnName: "Record" },
    { field: "Player", columnName: "Player" },
    { field: "Date", columnName: "Date" },
    { field: "Actions", columnName: "Actions" },
  ];

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

    performSort(column, order);
  }

  const performSort = (column, order) => {
    const sorter = (a, b) => {
      switch (column) {
        case "Record": return a.Record.localeCompare(b.Record);
        case "Player": return a.Player.localeCompare(b.Player) || a.Record.localeCompare(b.Record);
        case "Date": return a.Date.localeCompare(b.Date) || a.Record.localeCompare(b.Record);
      }
    }

    trackData.Records.sort((a, b) => {
      if (!order) return a.Record.localeCompare(b.Record);
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

  const getVideoIcon = (videoURL) => {
    let videoIcon = <RxVideo />;

    if (videoURL?.includes("youtube") || videoURL?.includes("youtu.be")) videoIcon = <BsYoutube />;
    else if (videoURL?.includes("bilibili")) videoIcon = <RiBilibiliFill />;

    return videoIcon;
  }

  const handleDeleteRecord = async (record) => {
    toastIdRef.current = toast({
      description: `Deleting record...`,
      status: 'info'
    });

    const { error } = await supabase.from('records').delete().eq('ID', record.ID);

    if (error) {
      toast.update(toastIdRef.current, {
        description: `An error has occured attempting to delete your submitted record for ${trackData.Name}. Please refresh the page and try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    else {
      onCloseDeletePopover();

      trackData.Records.splice(trackData.Records.findIndex(i => i === record), 1);

      toast.update(toastIdRef.current, {
        description: `Record successfully deleted.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    toastIdRef.current = null;
  }

  return (
    <div id="recordsComponent">
      <Text><NavLink to="../tracks" style={{ display: "inline-flex", alignItems: "center" }}><BiArrowBack />&nbsp;Return to Tracks List</NavLink></Text>

      <Flex alignItems={"center"}>
        <Heading as='h3' size='lg' mt={4} mb={2}>Records for {trackData.Name}</Heading>
        <Spacer />
        {user ? <Button onClick={onOpen}>Add Record</Button> : <></>}
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
                      {/* <Td><Tooltip label={record.seasonOfRecord}>{new Date(record.Date).toISOString().split('T')[0]}</Tooltip></Td> */}
                      <Td><Tooltip label={record.seasonOfRecord}>{record.Date}</Tooltip></Td>
                      <Td>
                        <Tooltip label="Watch Video">
                          <IconButton aria-label="Watch Video" icon={getVideoIcon(record.Video)} onClick={() => {
                            setRecordToView(record);
                            onOpenVideoModal();
                          }} />
                        </Tooltip>
                        {((import.meta.env.VITE_CREATOR_UUID && user?.id === import.meta.env.VITE_CREATOR_UUID) || user?.id === record.SubmittedByID) ? <>
                          <Tooltip label="Edit Record">
                            <IconButton aria-label="Edit Record" icon={<BiEdit />} onClick={() => {
                              setRecordToEdit(record);
                              onOpen();
                            }} />
                          </Tooltip>
                          <Popover
                            isOpen={deletePopover === record.ID}
                            onOpen={() => onOpenDeletePopover(record)}
                            onClose={onCloseDeletePopover}>
                            {/* https://github.com/chakra-ui/chakra-ui/issues/2843#issuecomment-748641805 */}
                            <Tooltip label="Delete Record">
                              <Box display="inline-block">
                                <PopoverTrigger>
                                  <IconButton aria-label="Delete Record" icon={<RiDeleteBin6Line />} colorScheme='red' />
                                </PopoverTrigger>
                              </Box>
                            </Tooltip>
                            <PopoverContent w={350}>
                              <PopoverHeader fontWeight='semibold'>Delete Record</PopoverHeader>
                              <PopoverArrow />
                              <PopoverCloseButton />
                              <PopoverBody>
                                Are you sure you want to delete this record?
                              </PopoverBody>
                              <PopoverFooter display='flex' justifyContent='flex-end'>
                                <ButtonGroup size='sm'>
                                  <Button variant='outline' onClick={() => {
                                    onCloseDeletePopover();
                                  }}>Cancel</Button>
                                  <Button colorScheme='red' onClick={async () => {
                                    await handleDeleteRecord(record);
                                  }}>Delete</Button>
                                </ButtonGroup>
                              </PopoverFooter>
                            </PopoverContent>
                          </Popover>
                        </> : <></>}
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

      <RecordModal
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        rootData={rootData}
        trackData={trackData}
        sortOptions={sortOptions}
        performSort={performSort}
        recordToEdit={recordToEdit}
        setRecordToEdit={setRecordToEdit}
        user={user}
      />

      <VideoModal
        isOpen={isOpenVideoModal}
        onClose={onCloseVideoModal}
        trackData={trackData}
        recordToView={recordToView}
        setRecordToView={setRecordToView}
      />
    </div>
  );
}