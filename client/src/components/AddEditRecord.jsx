import { useEffect, useState, useRef } from 'react'

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
    Spinner
} from '@chakra-ui/react'

import { BsFillQuestionCircleFill } from 'react-icons/bs'
import { Link } from 'react-router-dom';

const AddEditRecord = (props) => {
    const isOpen = props.isOpen;
    const onOpen = props.onOpen;
    const onClose = props.onClose;

    const initialRef = useRef(null);
    const finalRef = useRef(null);

    const [controlType, setControlType] = useState(null);

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

        // Set the cursor to the "expected" position after paste logic is complete
        e.target.selectionStart = selectionStart;
        e.target.selectionEnd = selectionStart;

        e.preventDefault();
    };

    const insertCharIntoString = (chr, str, position) => {
        return `${str.substring(0, position)}${chr}${str.substring(position)}`;
    };

    const modalSave = () => {
        console.log(props.trackData)

        // Get all the field information
        const record = document.getElementById("record")?.value;
        const date = document.getElementById("date")?.value;
        const player = document.getElementById("player")?.value;
        const video = document.getElementById("video")?.value;
        const region = document.getElementById("region")?.value;
        const kart = document.getElementById("kart")?.value;
        const racer = document.getElementById("racer")?.value;

        const controlTypeOther = document.getElementById("controlTypeOther")?.value;

        const form = {
            trackID: props.trackData.ID,
            record,
            date,
            player: player || "???",
            video: video || null,
            region: region || null,
            kart: kart || null,
            racer: racer || null,
            controlType: controlType !== "Other" ? controlType : (controlTypeOther || null)
        };

        console.log(form)

        try {
            fetch(`${import.meta.env.VITE_SERVER_URL}/records`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form)
            });
        } catch (error) {

        } finally {

        }
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
                <ModalHeader>Add or Edit a Record for {props.trackData.Name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Heading as='h5' size='sm' mb={4}>Primary Information</Heading>
                    <FormControl isRequired>
                        <FormLabel>Record</FormLabel>
                        <Input
                            id="record"
                            ref={initialRef}
                            pattern="\d{2}:\d{2}.\d{3}"
                            placeholder='##:##.###'
                            maxLength={9}
                            onKeyDown={recordOnKeyDown}
                            onInput={recordOnInput}
                            onPaste={recordOnPaste}
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
                            type="date"
                            // First day of preseason
                            min="2023-01-11"
                            // Current date, formatted yyyy-mm-dd
                            max={new Date().toJSON().slice(0, 10)}
                        />
                    </FormControl>

                    <FormControl mt={4}>
                        <Box display="flex" alignItems="baseline">
                            <FormLabel>Player</FormLabel>
                            <Tooltip label="If you can't input the player's name (for example, the name is Korean and you don't have Korean input) and the video uploader is the record setter, put the uploader's name. If you are pretty sure the uploader is not the record setter, leave this input blank and it will default to ???.">
                                <span><BsFillQuestionCircleFill /></span>
                            </Tooltip>
                        </Box>
                        <Input id="player" placeholder='Insert player name here' />
                    </FormControl>

                    <FormControl mt={4} isRequired>
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
                                            <ListItem>YouTube or Bilibili videos are the standard recommendation, but any accessible link to a record video is acceptable.</ListItem>
                                            <ListItem>If the video contains multiple records, be sure to include the timestamp for the submitted track in question (ex. <ChakraLink href='https://youtu.be/CLwZkpI5OiQ?t=91' isExternal>https://youtu.be/CLwZkpI5OiQ?t=91</ChakraLink>)</ListItem>
                                        </UnorderedList>
                                    </PopoverBody>
                                </PopoverContent>
                            </Popover>
                        </Box>
                        <Input
                            id="video"
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=ygBl_gRTKfY"
                        />
                    </FormControl>

                    <Divider my={4} />

                    <Heading as='h5' size='sm' mb={4}>Secondary (Optional) Information</Heading>

                    <FormControl>
                        <FormLabel>Region</FormLabel>
                        <Select id="region" placeholder='--'>
                            {props.rootData.countries.filter(country => country.Code !== "ALL").map(country => {
                                return <option key={country.Code} value={country.Code}>{country.Code} ({country.Name})</option>
                            })}
                        </Select>
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Kart</FormLabel>
                        <Input id="kart" placeholder="Insert kart name here" />
                    </FormControl>

                    <FormControl mt={4}>
                        <FormLabel>Racer</FormLabel>
                        <Input id="racer" placeholder="Insert racer name here (ex. Dao, Diz, Brodi, etc.)" />
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

                        {controlType === "Other" ? <Input id="controlTypeOther" placeholder="Insert control type here" /> : <></>}
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={modalSave}>
                        Save
                    </Button>
                    <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>);
}

export default AddEditRecord;