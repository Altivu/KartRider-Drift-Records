import { useState, useEffect, useRef } from 'react';
import { useLoaderData, NavLink, useRouteLoaderData, useOutletContext } from "react-router-dom";
import { supabase } from "../main";

import { Button, Heading, Table, TableContainer, Td, Thead, Tbody, Tr, Image, HStack, Tooltip, Th, Text, Link as ChakraLink, useToast, useDisclosure, SimpleGrid, Box, Input, InputGroup, InputLeftElement, FormControl, FormLabel, Switch } from '@chakra-ui/react';

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

import VideoModal from "../components/VideoModal";

import EditableRecord from '../components/shared/EditableRecord'
import { SearchIcon } from '@chakra-ui/icons';
import { BsFillQuestionCircleFill } from 'react-icons/bs';

export async function loader({ _ }) {
    try {
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

        // // Test forced wait before loading
        // await new Promise(resolve => setTimeout(resolve, 2000));

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

export default function Tracks() {
    const tracks = useLoaderData();
    const rootData = useRouteLoaderData("root");
    const toast = useToast();
    const toastIdRef = useRef(null);

    // Manually clipped minimaps for the newer tracks that don't have any datamine information
    const minimaps = Object.values(import.meta.glob('../assets/minimaps/*', { eager: true, as: 'url' }))

    const { isOpen: isOpenVideoModal, onOpen: onOpenVideoModal, onClose: onCloseVideoModal } = useDisclosure();

    const [_, user] = useOutletContext();

    const [filteredTracks, setFilteredTracks] = useState(tracks);
    const [trackThemeSearchResult, setTrackThemeSearchResult] = useState("");

    let trackThemeSearchTimer = null;

    // More table filters
    const [bSpeedGrandPrix, setBSpeedGrandPrix] = useState(localStorage.getItem("bSpeedGrandPrix") === "true" || false);
    const [bRecordsView, setBRecordsView] = useState(localStorage.getItem("bRecordsView") === "true" || false);

    // Used for the video modal when clicking a "top record" link
    const [trackData, setTrackData] = useState(null);
    const [recordToView, setRecordToView] = useState(null);

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

    const COLUMNS_RECORD_VIEW = [
        { field: "InternalID", columnName: "" },
        { field: "Name", columnName: "Name" },
        { field: "Theme", columnName: "Theme" },
        { field: "TopSavedRecord", columnName: "Top Saved Record" },
        { field: "Player", columnName: "Player" },
        { field: "TopRecordDate", columnName: "Date of Record" },
    ];

    // Set season description on relase date column
    if (rootData.seasons) {
        tracks.forEach(track => {
            // Get the season AFTER the track's season due to date comparator logic
            let indexOfSeasonOfReleaseDate = rootData.seasons.findIndex(s => new Date(s.Date) > new Date(track.ReleaseDate));

            if (indexOfSeasonOfReleaseDate === -1) indexOfSeasonOfReleaseDate = rootData.seasons.length;

            track.seasonOfReleaseDate = rootData.seasons[indexOfSeasonOfReleaseDate - 1]?.Description;
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

        performSort(column, order);
    }

    const sorter = (a, b, column) => {
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
            case "Player": return a.Player?.localeCompare(b.Player) || a.Name.localeCompare(b.Name);
            case "TopRecordDate": return a.TopRecordDate?.localeCompare(b.TopRecordDate) || a.Name.localeCompare(b.Name);
        }
    }

    const performSort = (column, order) => {
        filteredTracks.sort((a, b) => {
            if (!order) return a.ListOrder - b.ListOrder;
            else if (order === "Asc") return sorter(a, b, column);
            else return sorter(b, a, column);
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

    useEffect(() => {
        setFilteredTracks(
            // Filter by search
            tracks.filter(track => track.Name.toLocaleLowerCase().includes(trackThemeSearchResult) || track.Theme.toLocaleLowerCase().includes(trackThemeSearchResult))

                // Filter by speed mode grand prix
                .filter(track => !bSpeedGrandPrix || (!track.BItemMode || ["Cogwheel Crush", "Magma Cavern", "Mother Lode"].includes(track.Name)))

                // Apply sort individually from the standard header clicking
                .sort((a, b) => {
                    if (!sortOptions.order) return a.ListOrder - b.ListOrder;
                    else if (sortOptions.order === "Asc") return sorter(a, b, sortOptions.column);
                    else return sorter(b, a, sortOptions.column);
                })
        );
    }, [tracks, trackThemeSearchResult, bSpeedGrandPrix]);

    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Tracks</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={5}>
                <Box>
                    <InputGroup>
                        <InputLeftElement pointerEvents='none' children={<SearchIcon />}></InputLeftElement>
                        <Input placeholder='Search by track name or theme' onChange={e => {
                            clearTimeout(trackThemeSearchTimer);

                            trackThemeSearchTimer = setTimeout(() => {
                                setTrackThemeSearchResult(e.target.value)
                            }, 500);
                        }}></Input>
                    </InputGroup>
                </Box>
                <Box>
                    <FormControl as={SimpleGrid} columns={{ base: 2 }} alignItems='center'>
                        <FormLabel htmlFor='bSpeedGrandPrix' mb='0'>
                            Show Speed Grand Prix Tracks Only
                        </FormLabel>
                        <Switch id='bSpeedGrandPrix' value={bSpeedGrandPrix} isChecked={bSpeedGrandPrix} onChange={e => {
                            localStorage.setItem("bSpeedGrandPrix", e.target.checked);
                            setBSpeedGrandPrix(e.target.checked)
                        }} />
                    </FormControl>
                </Box>
                <Box>
                    <FormControl as={SimpleGrid} columns={{ base: 2 }} alignItems='center'>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel htmlFor='bRecordsView' mb='0'>
                                Show Records View </FormLabel>
                            <Tooltip label="Strips out extraneous track info and only shows the top saved record details.">
                                <span><BsFillQuestionCircleFill /></span>
                            </Tooltip>
                        </Box>
                        <Switch id='bRecordsView' value={bRecordsView} isChecked={bRecordsView} onChange={e => {
                            localStorage.setItem("bRecordsView", e.target.checked);
                            setBRecordsView(e.target.checked)
                        }} />
                    </FormControl>
                </Box>
            </SimpleGrid>
            <TableContainer whiteSpace="normal">
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            {!bRecordsView ?
                                COLUMNS.map((column, index) => <Th key={index}>
                                    <HStack>
                                        <Text fontSize='sm' style={{ cursor: !["InternalID", "Records"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                                        {getSortIcon(column.field)}
                                    </HStack>
                                </Th>)
                                :
                                COLUMNS_RECORD_VIEW.map((column, index) => <Th key={index}>
                                    <HStack>
                                        <Text fontSize='sm' style={{ cursor: !["InternalID"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                                        {getSortIcon(column.field)}
                                    </HStack>
                                </Th>)
                            }
                            {user ? <Th><Text fontSize='sm' style={{ cursor: "default" }}>Your Saved Record (Click to edit)</Text></Th> : <></>}
                            <Th><Text fontSize='sm' style={{ cursor: "default" }}></Text></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            filteredTracks.map(track => {
                                return (<Tr key={track.ID}>
                                    <Td textAlign="-webkit-center">
                                        <Image
                                            src={track.InternalID ? `${import.meta.env.VITE_ASSETS_GITHUB_URL}/Track/MiniMap/SDF_Minimap_${track.InternalID}.png` : minimaps.find(minimap => minimap.includes(track.Name))}
                                            alt={track.Name}
                                            boxSize="100px"
                                            objectFit="contain"
                                            filter={track.InternalID ? "grayscale(1) invert(100%);" : ""}
                                            fallbackSrc='https://dummyimage.com/100'
                                            minWidth={50}
                                        />
                                    </Td>
                                    <Td>{track.Name}</Td>
                                    <Td>{track.Theme}</Td>

                                    {   // Standard View
                                        !bRecordsView ? <>
                                            <Td>{getLicenseField(track.License)}</Td>
                                            <Td><DifficultyComponent difficulty={track.Difficulty}></DifficultyComponent></Td>
                                            <Td>{track.Laps}</Td>
                                            <Td>{track.BItemMode ? "✓" : ""}</Td>
                                            <Td><Tooltip label={track?.seasonOfReleaseDate}>{track.ReleaseDate}</Tooltip></Td>
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
                                            </Td></> :

                                            // Records View
                                            <>
                                                <Td>{track.Record ? <>
                                                    <ChakraLink onClick={() => {
                                                        setTrackData(track);
                                                        setRecordToView({
                                                            Record: track.Record,
                                                            Player: track.Player,
                                                            Video: track.Video
                                                        });

                                                        onOpenVideoModal();
                                                    }}>{track.Record}
                                                    </ChakraLink>
                                                </> : "--:--.---"}</Td>

                                                <Td>{track.Player}</Td>
                                                <Td>{track.TopRecordDate}</Td>
                                            </>}

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
                                            minWidth={50}
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