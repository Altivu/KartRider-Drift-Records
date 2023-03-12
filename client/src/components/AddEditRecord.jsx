import { useEffect, useState, useRef, useMemo } from 'react'

import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Tooltip,
    Box,
    Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody, UnorderedList, ListItem,
    Link as ChakraLink,
    Heading,
    Divider,
    Select,
    Spinner,
    RadioGroup, Radio,
    HStack,
    useToast
} from '@chakra-ui/react'

import { BsFillQuestionCircleFill } from 'react-icons/bs'

const AddEditRecord = (props) => {
    const toast = useToast();

    const isOpen = props.isOpen;
    const onOpen = props.onOpen;
    const onClose = props.onClose;

    const initialRef = useRef(null);
    const finalRef = useRef(null);
    const videoRef = useRef(null);

    const [recordType, setRecordType] = useState(1);
    const [record, setRecord] = useState("");
    const [date, setDate] = useState("");
    const [player, setPlayer] = useState("");
    const [video, setVideo] = useState("");

    const [region, setRegion] = useState("");
    const [kart, setKart] = useState("");
    const [racer, setRacer] = useState("");
    const [controlType, setControlType] = useState(null);
    const [controlTypeOther, setControlTypeOther] = useState("");

    const [bSubmittingRecord, setBSubmittingRecord] = useState(false);

    const [editInitialState, setEditInitialState] = useState({});
    const [bEditInitialized, setBEditInitialized] = useState(false);

    // Check if an edit record prompt was set, and if so, populate fields + change modal title accordingly
    useEffect(() => {
        if (props.recordToEdit && !bEditInitialized) {
            setRecord(props.recordToEdit.Record);
            setDate(new Date(props.recordToEdit.Date).toISOString().split('T')[0]);
            setPlayer(props.recordToEdit.Player);
            setVideo(props.recordToEdit.Video);

            setKart(props.recordToEdit.Kart);
            setRacer(props.recordToEdit.Racer);
            setControlTypeOther([null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? "" : props.recordToEdit.ControlType);

            // Dropdowns don't initialize proper and need to be set with timeout + direct DOM manipulation???
            setTimeout(() => {
                setRegion(props.recordToEdit.Region);
                document.getElementById("region").value = props.recordToEdit.Region;

                let controlType = [null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? props.recordToEdit.ControlType : "Other";

                setControlType(controlType);
                document.getElementById("controlType").value = controlType;

                console.log(record)

                setEditInitialState({
                    record: props.recordToEdit.Record,
                    date: new Date(props.recordToEdit.Date).toISOString().split('T')[0],
                    player: props.recordToEdit.Player,
                    video: props.recordToEdit.Video,
                    kart: props.recordToEdit.Kart,
                    racer: props.recordToEdit.Racer,
                    controlType: [null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? props.recordToEdit.ControlType : "Other",
                    controlTypeOther: [null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? "" : props.recordToEdit.ControlType
                });
            });

            setBEditInitialized(true);
        }
    });

    const formErrorObj = useMemo(() => {
        return [{
            validCheck: initialRef?.current?.pattern && new RegExp(initialRef.current.pattern).test(record),
            errorMsg: "Record contains an invalid value"
        },
        {
            validCheck: Boolean(date),
            errorMsg: "Date contains an invalid value"
        },
        {
            validCheck: Boolean(video),
            errorMsg: "Video URL contains an invalid value"
        },
        // {
        //     // ISSUE: This check breaks if the user pastes anything in for some reason
        //     validCheck: videoRef?.current?.checkValidity() && video.length > 1,
        //     errorMsg: "Video URL is not correctly formatted (urlscheme://restofurl)"
        // },
        {
            validCheck: controlType !== "Other" || controlTypeOther,
            errorMsg: "Control Type - Other contains an invalid value"
        }
        ];
    }, [record, date, video, controlType, controlTypeOther]);

    const bFormValid = useMemo(() => {
        return formErrorObj.every(item => item.validCheck);
    }, [formErrorObj]);

    // Records input formatting logic
    // Track where the cursor should be for the record time input after changes
    let globalSelectionStart = undefined;

    const recordOnKeyDown = (e) => {
        // Allow numbers, but also inject ":" or "." if applicable
        if (/[0-9]/.test(e.key)) {
            let selectionStart = e.target.selectionStart;

            if (e.target.value.length === 2) {
                e.target.value += ":";
            } else if (e.target.value.length === 5) {
                e.target.value += ".";
            }

            // Preserve cursor position (instead of having it jump to end)
            globalSelectionStart = selectionStart + 2;

            return true;
        }
        // Other permissible keys (I am 100% going to miss something basic)
        else if (
            ["Backspace", "Delete", "Tab", "Home", "End"].includes(e.key) ||
            e.key.includes("Arrow") ||
            // Select All/Undo/Redo/Cut/Copy/Paste
            (e.ctrlKey && ["a", "z", "Z", "x", "c", "v"].includes(e.key))
        ) {
            return true;
        }
        // Check for valid manual insertion of ":" and "."
        else if (
            (e.key === ":" && e.target.value.length === 2) ||
            (e.key === "." && e.target.value.length === 5)
        ) {
            return true;
        } else {
            // It seems like return false doesn't block the input by default, so use preventDefault instead
            e.preventDefault();
            return false;
        }
    }

    const recordOnInput = (e) => {
        let selectionStart = e.target.selectionStart;

        // Remove ":" and "." if they are in an incorrect position
        // Replacing value with a hypen and then replacing it because I don't want to spend time figuring out proper looping while deleting
        for (let i = 0; i < e.target.value.length; i++) {
            if (
                (e.target.value[i] === ":" && i !== 2) ||
                (e.target.value[i] === "." && i !== 5)
            ) {
                e.target.value =
                    e.target.value.substring(0, i) +
                    " " +
                    e.target.value.substring(i + 1);
            }
        }
        e.target.value = e.target.value.replace(/ /g, "");

        // Add ":" and "." if they aren't in the expected position
        if (
            e.target.value.length >= 3 &&
            e.target.value.substring(2, 3) !== ":"
        ) {
            e.target.value = insertCharIntoString(":", e.target.value, 2);
        }

        if (
            e.target.value.length >= 6 &&
            e.target.value.substring(5, 6) !== "."
        ) {
            e.target.value = insertCharIntoString(".", e.target.value, 5);
        }

        if (globalSelectionStart) {
            e.target.selectionStart = globalSelectionStart;
            e.target.selectionEnd = globalSelectionStart;
            globalSelectionStart = undefined;
        } else {
            e.target.selectionStart = selectionStart;
            e.target.selectionEnd = selectionStart;
        }
    }

    // Use this to format pasted data
    // Going to do this piece by piece-by-piece I am bad at programming
    const recordOnPaste = (e) => {
        // Get current position of cursor in input box
        let selectionStart = e.target.selectionStart;
        let textToPaste = e.clipboardData.getData("text");

        // If something has been selected and there is text to paste (even if fully invalid), delete the selection as standard logic
        if (textToPaste.length && selectionStart !== e.target.selectionEnd) {
            e.target.value =
                e.target.value.substring(0, selectionStart) +
                e.target.value.substring(e.target.selectionEnd);
        }

        for (let chr of textToPaste) {
            // Break out of loop if max length of input has been reached
            if (e.target.value.length >= e.target.maxLength) break;
            // Don't allow non-numeric characters unless it is ":" or "."
            if (!/[0-9]|:|\./.test(chr)) continue;
            // If ";" or "." would otherwise be inserted into the wrong position, ignore
            if (
                (chr === ":" && e.target.value.length !== 2) ||
                (chr === "." && e.target.value.length !== 5)
            )
                continue;

            // Check for automatic insertion of ":" and "."
            if (/[0-9]/.test(chr)) {
                if (selectionStart === 2) {
                    e.target.value = insertCharIntoString(
                        ":",
                        e.target.value,
                        selectionStart++
                    );
                } else if (selectionStart === 5) {
                    e.target.value = insertCharIntoString(
                        ".",
                        e.target.value,
                        selectionStart++
                    );
                }
            }

            // Append value manually and prevent standard paste logic
            e.target.value = insertCharIntoString(
                chr,
                e.target.value,
                selectionStart++
            );
        }

        setRecord(e.target.value);

        // Set the cursor to the "expected" position after paste logic is complete
        e.target.selectionStart = selectionStart;
        e.target.selectionEnd = selectionStart;

        e.preventDefault();
    };

    const insertCharIntoString = (chr, str, position) => {
        return `${str.substring(0, position)}${chr}${str.substring(position)}`;
    };

    const modalSave = async () => {
        try {
            setBSubmittingRecord(true);

            // Add Record Logic
            if (!bEditInitialized) {
                // Get all the field information
                const form = {
                    TrackID: props.trackData.ID,
                    Record: record,
                    Date: date,
                    Player: player || "???",
                    Video: video || null,
                    Region: region || null,
                    Kart: kart || null,
                    Racer: racer || null,
                    ControlType: controlType !== "Other" ? controlType : (controlTypeOther || null),
                    SubmittedByID: null,
                    SubmittedByName: "AltiV",
                    BPersonalRecord: recordType == 2,
                    BDisplay: true
                };

                await fetch(`${import.meta.env.VITE_SERVER_URL}/records`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(form)
                });

                // Update records with the newly added record and sort based on previously selected options
                props.trackData.Records.push(form);
                props.performSort(props.sortOptions.column);

                toast({
                    description: "Record successfully added.",
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            }
            // Edit Record Logic
            else {
                const form = {};

                // Let's go over all the fields one by one and see if they have changed...
                if (record !== editInitialState.record) form.Record = record;
                if (date !== editInitialState.date) form.Date = date;
                if (player !== editInitialState.player) form.Player = player || "???";
                if (video !== editInitialState.video) form.Video = video || null;
                if (kart !== editInitialState.kart) form.Kart = kart || null;
                if (racer !== editInitialState.racer) form.Racer = racer || null;
                if (controlType !== editInitialState.controlType) form.ControlType = controlType !== "Other" ? controlType : (controlTypeOther || null);
                if (controlTypeOther !== editInitialState.controlTypeOther) form.ControlType = controlType !== "Other" ? controlType : (controlTypeOther || null);

                if (!Object.keys(form).length) {
                    toast({
                        description: "Record had nothing to update.",
                        status: 'info',
                        duration: 5000,
                        isClosable: true,
                    });
                }
                else {

                }

                // setEditInitialState({
                //     record: props.recordToEdit.Record,
                //     date: new Date(props.recordToEdit.Date).toISOString().split('T')[0],
                //     player: props.recordToEdit.Player,
                //     video: props.recordToEdit.Video,
                //     kart: props.recordToEdit.Kart,
                //     racer: props.recordToEdit.Racer,
                //     controlType: [null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? props.recordToEdit.ControlType : "Other",
                //     controlTypeOther: [null, "Keyboard", "Controller", "Touch Screen"].includes(props.recordToEdit.ControlType) ? "" : props.recordToEdit.ControlType
                // });

                return;

                await fetch(`${import.meta.env.VITE_SERVER_URL}/records/${props.recordToEdit.ID}`, {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(form)
                });

                // Update records with the newly added record and sort based on previously selected options
                props.trackData.Records.push(form);
                props.performSort(props.sortOptions.column);

                toast({
                    description: "Record successfully added.",
                    status: 'success',
                    duration: 5000,
                    isClosable: true,
                });
            }

            props.onClose();
        } catch (error) {
            console.error(error);

            toast({
                description: "There was an error processing your request. Please try again later.",
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setBSubmittingRecord(false);
        }
    }

    const modalClose = () => {
        if (props.recordToEdit) props.setRecordToEdit(null);

        // Reset all the states one by one...
        setRecordType(1);
        setRecord("");
        setDate("");
        setPlayer("");
        setVideo("");

        setRegion("");
        setKart("");
        setRacer("");
        setControlType(null);
        setControlTypeOther("");

        setBSubmittingRecord(false);

        setBEditInitialized(false);

        props.onClose();
    }

    return (
        <Modal
            closeOnOverlayClick={false}
            initialFocusRef={initialRef}
            finalFocusRef={finalRef}
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{!bEditInitialized ? "Add" : "Edit"} Record for {props.trackData.Name}</ModalHeader>
                <ModalCloseButton isDisabled={bSubmittingRecord} onClick={modalClose} />
                <ModalBody pb={6}>
                    {/* <FormControl>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Is this a standard or personal record?</FormLabel>
                            <Popover trigger="hover">
                                <PopoverTrigger>
                                    <span><BsFillQuestionCircleFill /></span>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverBody>
                                        <UnorderedList>
                                            <ListItem><strong>Standard record:</strong> Record must be submitted with a video, and will be visible to everyone.</ListItem>
                                            <ListItem><strong>Personal record:</strong> Record does not have to be submitted with a video, and will only be visible to self. This is meant for tracking your own records.</ListItem>
                                        </UnorderedList>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </Box>
                        <RadioGroup id="recordType" defaultValue="1" onChange={e => setRecordType(e)}>
                            <HStack spacing={4}>
                                <Radio value="1">Standard Record</Radio>
                                <Radio value="2">Personal Record</Radio>
                            </HStack>
                        </RadioGroup>
                    </FormControl>

                    <Divider my={4} /> */}

                    <Heading as='h5' size='sm' my={4}>Primary Information</Heading>
                    <FormControl isRequired>
                        <FormLabel>Record</FormLabel>
                        <Input
                            id="record"
                            value={record}
                            ref={initialRef}
                            pattern="\d{2}:\d{2}.\d{3}"
                            placeholder='##:##.###'
                            maxLength={9}
                            onChange={e => setRecord(e.target.value)}
                            onKeyDown={recordOnKeyDown}
                            onInput={recordOnInput}
                            onPaste={recordOnPaste}
                            autoComplete="off"
                        />
                    </FormControl>

                    <FormControl mt={4} isRequired>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Date of Record</FormLabel>
                            <Tooltip label="If you don't know the exact date of record, put the video's date. Records prior to Pre-Season (January 11th, 2023) are not valid.">
                                <span><BsFillQuestionCircleFill /></span>
                            </Tooltip>
                        </Box>

                        <Input
                            id="date"
                            value={date}
                            type="date"
                            // First day of preseason
                            min="2023-01-11"
                            // Current date, formatted yyyy-mm-dd
                            max={new Date().toJSON().slice(0, 10)}
                            onChange={e => setDate(e.target.value)}
                            autoComplete="off"
                        />
                    </FormControl>

                    <FormControl mt={4}>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Player</FormLabel>
                            <Tooltip label="If you can't input the player's name (for example, the name is Korean and you don't have Korean input) and the video uploader is the record setter, put the uploader's name. If you are pretty sure the uploader is not the record setter, leave this input blank and it will default to ???.">
                                <span><BsFillQuestionCircleFill /></span>
                            </Tooltip>
                        </Box>
                        <Input
                            id="player"
                            value={player}
                            placeholder='Insert player name here'
                            onChange={e => setPlayer(e.target.value)} />
                    </FormControl>

                    <FormControl mt={4} isRequired={recordType == "1"}>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Video URL</FormLabel>
                            <Popover trigger="hover">
                                <PopoverTrigger>
                                    <span><BsFillQuestionCircleFill /></span>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverBody>
                                        <UnorderedList>
                                            <ListItem>Please be respectful and do not submit inappropriate content.</ListItem>
                                            <ListItem>YouTube videos are the standard recommendation, but any accessible link to a record video is acceptable.</ListItem>
                                            <ListItem>If the video contains multiple records, be sure to include the timestamp for the submitted track in question (ex. <ChakraLink href='https://youtu.be/CLwZkpI5OiQ?t=91' isExternal>https://youtu.be/CLwZkpI5OiQ?t=91</ChakraLink>)</ListItem>
                                        </UnorderedList>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </Box>
                        <Input
                            id="video"
                            ref={videoRef}
                            value={video}
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=ygBl_gRTKfY"
                            onChange={e => setVideo(e.target.value)}
                            autoComplete="off"
                        />
                    </FormControl>

                    <Divider my={4} />

                    <Heading as='h5' size='sm' mb={4}>Secondary (Optional) Information</Heading>

                    <FormControl>
                        <FormLabel>Region</FormLabel>
                        <Select id="region" placeholder='--' onChange={(e => setRegion(e.target.value))}>
                            {props.rootData.countries.filter(country => country.Code !== "ALL").map(country => {
                                return <option key={country.Code} value={country.Code}>{country.Code} ({country.Name})</option>
                            })}
                        </Select>
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Kart</FormLabel>
                        <Input id="kart" value={kart} placeholder="Insert kart name here" onChange={e => setKart(e.target.value)} />
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Racer</FormLabel>
                        <Input id="racer" value={racer} placeholder="Insert racer name here (ex. Dao, Diz, Brodi, etc.)" onChange={e => setRacer(e.target.value)} />
                    </FormControl>

                    <FormControl mt={4}>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Control Type</FormLabel>
                            <Popover trigger="hover">
                                <PopoverTrigger>
                                    <span><BsFillQuestionCircleFill /></span>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <PopoverArrow />
                                    <PopoverBody>
                                        <UnorderedList>
                                            <ListItem>Standard options are Keyboard, Controller, and Touch Screen (mobile).</ListItem>
                                            <ListItem>Control Type takes precedence over system; a player can play on the computer using a controller, a console using a keyboard, etc.</ListItem>
                                            <ListItem>"Other" can involve non-standard options like racing wheels, dance pads, Rock Band drum sets, etc...</ListItem>
                                        </UnorderedList>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </Box>
                        <Select id="controlType" placeholder='--' onChange={e => setControlType(e.target.value)}>
                            <option value="Keyboard">Keyboard</option>
                            <option value="Controller">Controller</option>
                            <option value="Touch Screen">Touch Screen</option>
                            <option value="Other">Other</option>
                        </Select>

                        {controlType === "Other" ? <Input id="controlTypeOther" value={controlTypeOther} placeholder="Insert control type here" onChange={e => setControlTypeOther(e.target.value)} /> : <></>}
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    {(!bFormValid ? <Popover trigger="hover">
                        <PopoverTrigger>
                            {/* The additional div wrapper is to allow the popover trigger to work for a disabled button */}
                            <div>
                                <Button colorScheme='blue' mr={3} isDisabled>
                                    Save
                                </Button>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverArrow />
                            <PopoverBody>
                                <UnorderedList>
                                    {formErrorObj.filter(item => !item.validCheck).map((item, index) => (
                                        <ListItem key={index}>{item.errorMsg}</ListItem>
                                    ))}
                                </UnorderedList>
                            </PopoverBody>
                        </PopoverContent>
                    </Popover> : <Button colorScheme='blue' mr={3} onClick={modalSave} isLoading={bSubmittingRecord} loadingText="Submitting record..." spinnerPlacement='start'>
                        Save
                    </Button>)}
                    <Button onClick={modalClose} isDisabled={bSubmittingRecord}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal >);
}

export default AddEditRecord;