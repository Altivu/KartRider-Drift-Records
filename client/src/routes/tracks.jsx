import { useState, useEffect, useRef } from 'react';
import { Form, useLoaderData, NavLink, useRouteLoaderData, useOutletContext } from "react-router-dom";
import { supabase } from "../main";

import { Button, Heading, Table, TableContainer, Td, Thead, Tbody, Tr, Image, HStack, Tooltip, Th, Text, Link as ChakraLink, useToast, useDisclosure } from '@chakra-ui/react';

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

import VideoModal from "../components/VideoModal";

import EditableRecord from '../components/shared/EditableRecord'

export async function loader({ params }) {
    try {
        // // Express server call
        // const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tracks`);

        // return response.json();

        // Supabase call
        // This is a specific view that uses DISTINCT ON and PARTITION BY
        /*
CREATE OR REPLACE FUNCTION PUBLIC.GET_TRACKS_WITH_TOP_AND_PERSONAL_RECORD(USERID UUID DEFAULT NULL::UUID) RETURNS TABLE("ID" bigint, "InternalID" CHARACTER varying, "ListOrder" bigint, "Name" CHARACTER varying, "Theme" CHARACTER varying, "License" CHARACTER varying, "Difficulty" bigint, "Laps" bigint, "BItemMode" boolean, "BReleaseDate" date, "TrackID" int, "Record" CHARACTER varying, "Player" CHARACTER varying, "Video" CHARACTER varying, "TopRecordDate" date, "NumberOfRecords" bigint, "PersonalRecord" CHARACTER varying) LANGUAGE 'sql' AS $BODY$
 SELECT tracks.*,
    "ParsedRecords"."TrackID",
    "ParsedRecords"."Record",
    "ParsedRecords"."Player",
    "ParsedRecords"."Video",
    "ParsedRecords"."TopRecordDate",
    "ParsedRecords"."NumberOfRecords",
    (SELECT Record FROM personal_records WHERE TRACKS."ID" = personal_records."trackID" AND userid = personal_records."userID" FETCH FIRST 1 ROW ONLY) "PersonalRecord"
   FROM tracks
     LEFT JOIN ( SELECT DISTINCT ON (records."TrackID") records."TrackID",
            records."Record",
            records."Player",
            records."Video",
            records."Date" AS "TopRecordDate",
            count(records."TrackID") OVER (PARTITION BY records."TrackID") AS "NumberOfRecords"
           FROM records
          ORDER BY records."TrackID", records."Record") "ParsedRecords" ON "ParsedRecords"."TrackID" = tracks."ID"
  ORDER BY tracks."ListOrder";
$BODY$;
        */
        const { data, error } = await supabase.rpc('get_tracks_with_top_and_personal_record', { "userid": localStorage.getItem("userID") });

        if (error) throw error;

        return data;
    }
    catch (error) {
        console.error(error)

        return [];
    }
}

const LICENSE_ORDER = ["None", "B3", "B2", "B1", "L3", "L2", "L1", "Pro"];

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

export default function Tracks(props) {
    const tracks = useLoaderData();
    const rootData = useRouteLoaderData("root");
    const toast = useToast();
    const toastIdRef = useRef(null);

    // Manually clipped minimaps for the newer tracks that don't have any datamine information
    const minimaps = Object.values(import.meta.glob('../assets/minimaps/*', { eager: true, as: 'url' }))

    const { isOpen: isOpenVideoModal, onOpen: onOpenVideoModal, onClose: onCloseVideoModal } = useDisclosure();

    const [_, user] = useOutletContext();

    // Used for the video modal when clicking a "top record" link
    const [trackData, setTrackData] = useState(null);
    const [recordToView, setRecordToView] = useState(null);

    const [sortOptions, setSortOptions] = useState({
        column: null,
        order: null
    });

    const COLUMNS = [
        { field: "InternalID", columnName: "ㅤㅤㅤㅤ" },
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
    if (rootData.seasons) {
        tracks.forEach(track => {
            // Get the season AFTER the track's season due to date comparator logic
            let indexOfSeasonOfRecord = rootData.seasons.findIndex(s => new Date(s.Date) > new Date(track.ReleaseDate));

            if (indexOfSeasonOfRecord === -1) indexOfSeasonOfRecord = rootData.seasons.length;

            track.seasonOfRecord = rootData.seasons[indexOfSeasonOfRecord - 1]?.Description;
        });
    }

    // Logic when a user sorts by a column
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
                case "ReleaseDate": return a.ReleaseDate.localeCompare(b.ReleaseDate) || a.Name.localeCompare(b.Name);
                case "TopSavedRecord": {
                    if (!a.Record && b.Record) {
                        return 1;
                    }
                    else if (a.Record && !b.Record) {
                        return -1;
                    }
                    else if (!a.Record && !b.Record) {
                        return a.Name.localeCompare(b.Name);
                    }
                    else {
                        return a.Record.localeCompare(b.Record);
                    }
                }
            }
        }

        tracks.sort((a, b) => {
            if (!order) return a.ListOrder - b.ListOrder;
            else if (order === "Asc") return sorter(a, b);
            else return sorter(b, a);
        });
    }

    // Get standard, up, or down sort icon based on sortOptions
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

    // Logic to handle a user updating a personal record
    const handlePersonalRecord = async (trackID, record, validSubmit) => {
        const trackToEdit = tracks.find(x => x.ID === trackID);

        // If the track ID is invalid for some reason, do not continue
        if (!trackToEdit) return;

        // If the record was not changed, do not continue
        if (record === trackToEdit.PersonalRecord) return;

        if (!validSubmit) {
            // If the record is being cleared, check if a personal record for this existed previously and remove it if so
            if (record === "--:--.---" || !record) {
                if (!trackToEdit.PersonalRecord) return;
                else {
                    toastIdRef.current = toast({
                        description: `Deleting personal record for ${trackToEdit.Name}...`,
                        status: 'info'
                    });

                    const { error } = await supabase.from('personal_records').delete().eq('userID', user.id).eq('trackID', trackID);

                    if (error) {
                        toast.update(toastIdRef.current, {
                            description: `An error has occured attempting to delete your personal record for ${trackToEdit.Name}. Please refresh the page and try again.`,
                            status: 'error',
                            duration: 5000,
                            isClosable: true,
                        });
                    }
                    else {
                        toast.update(toastIdRef.current, {
                            description: `Record for ${trackToEdit.Name} succesfully deleted.`,
                            status: 'success',
                            duration: 5000,
                            isClosable: true,
                        });

                        // Update personal record in tracks object on client-side
                        trackToEdit.PersonalRecord = record;
                    }

                    toastIdRef.current = null;
                }
            }
            // Generic invalid personal record submitted toast
            else {
                toast({
                    description: `Invalid record value "${record}" for ${tracks.find(x => x.ID === trackID).Name} (value should follow pattern ##:##.###)`,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        }
        // Properly formatted personal record
        else {
            toastIdRef.current = toast({
                description: `Updating personal record for ${trackToEdit.Name}...`,
                status: 'info'
            });

            const { error } = await supabase.from('personal_records').upsert({ userID: user.id, trackID: trackID, record, modified_at: new Date() });

            if (error) {
                toast.update(toastIdRef.current, {
                    description: `An error has occured attempting to update your personal record for ${trackToEdit.Name}. Please refresh the page and try again.`,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
            else {
                toast.update(toastIdRef.current, {
                    description: `Record for ${trackToEdit.Name} succesfully updated.`,
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });

                // Update personal record in tracks object on client-side
                trackToEdit.PersonalRecord = record;
            }

            toastIdRef.current = null;
        }
    }

    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Tracks</Heading>
            <TableContainer whiteSpace="normal">
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            {COLUMNS.map((column, index) => <Th key={index}>
                                <HStack>
                                    <Text fontSize='sm' style={{ cursor: !["InternalID", "Records"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                                    {getSortIcon(column.field)}
                                </HStack>
                            </Th>)}
                            {user ? <Th><Text fontSize='sm' style={{ cursor: "default" }}>Your Saved Record (Click to edit)</Text></Th> : <></>}
                            <Th><Text fontSize='sm' style={{ cursor: "default" }}>ㅤㅤㅤㅤ</Text></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            tracks.map(track => {
                                return (<Tr key={track.ID}>
                                    <Td textAlign="-webkit-center">
                                        <Image
                                            src={track.InternalID ? `${import.meta.env.VITE_ASSETS_GITHUB_URL}/Track/MiniMap/SDF_Minimap_${track.InternalID}.png` : minimaps.find(minimap => minimap.includes(track.Name))}
                                            alt={track.Name}
                                            boxSize="100px"
                                            objectFit="contain"
                                            filter={track.InternalID ? "grayscale(1) invert(100%);" : ""}
                                            fallbackSrc='https://dummyimage.com/100'
                                        />
                                    </Td>
                                    <Td>{track.Name}</Td>
                                    <Td>{track.Theme}</Td>
                                    <Td>{getLicenseField(track.License)}</Td>
                                    <Td><DifficultyComponent difficulty={track.Difficulty}></DifficultyComponent></Td>
                                    <Td>{track.Laps}</Td>
                                    <Td>{track.BItemMode ? "✓" : ""}</Td>
                                    <Td><Tooltip label={track?.seasonOfRecord}>{track.ReleaseDate}</Tooltip></Td>
                                    <Td>{track.Record ? <Tooltip label={`by ${track.Player} on ${track.TopRecordDate}`}>
                                        <ChakraLink onClick={() => {
                                            setTrackData(track);
                                            setRecordToView({
                                                Record: track.Record,
                                                Player: track.Player,
                                                Video: track.Video
                                            });

                                            onOpenVideoModal();
                                        }}>{track.Record}</ChakraLink>
                                    </Tooltip> : "--:--.---"}</Td>
                                    <Td>
                                        <NavLink to={`${track.Name}`}>
                                            <Button>View ({track.NumberOfRecords || 0})</Button>
                                        </NavLink>
                                    </Td>
                                    {user ? <Td>
                                        <EditableRecord trackID={track.ID} PersonalRecord={track.PersonalRecord} handlePersonalRecord={handlePersonalRecord} />
                                    </Td> : <></>}
                                    <Td textAlign="-webkit-center">
                                        <Image
                                            src={track.InternalID ? `${import.meta.env.VITE_ASSETS_GITHUB_URL}/Track/MiniMap/SDF_Minimap_${track.InternalID}.png` : minimaps.find(minimap => minimap.includes(track.Name))}
                                            alt={track.Name}
                                            boxSize="100px"
                                            objectFit="contain"
                                            filter={track.InternalID ? "grayscale(1) invert(100%);" : ""}
                                            fallbackSrc='https://dummyimage.com/100'
                                        />
                                    </Td>
                                </Tr>)
                            })
                        }
                    </Tbody>
                </Table>
            </TableContainer>

            <VideoModal
                isOpen={isOpenVideoModal}
                onClose={onCloseVideoModal}
                trackData={trackData}
                recordToView={recordToView}
                setRecordToView={setRecordToView}
            />
        </>
    );
}