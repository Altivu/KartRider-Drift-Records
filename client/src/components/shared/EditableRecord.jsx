import {
    ButtonGroup, IconButton, Flex, Input,
    Editable,
    EditableInput,
    EditablePreview,
    useEditableControls,
    HStack
} from '@chakra-ui/react'

import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { useRef } from 'react';

export default function EditableRecord(props) {
    const inputRef = useRef(null);

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
            ["Backspace", "Delete", "Tab", "Home", "End", "Enter", "Escape"].includes(e.key) ||
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

    const onSubmit = e => {
        props.handlePersonalRecord(props.trackID, e, new RegExp(inputRef.current.pattern).test(e));
    }

    return (
        <Editable defaultValue={props.PersonalRecord || '--:--.---'}
            onSubmit={onSubmit}>
            <EditablePreview w={24} p={1} style={{ cursor: "pointer" }} _hover={{
                background: "white",
                color: "teal.500",
            }} />
            <Input as={EditableInput}
                ref={inputRef}
                w={28}
                pattern="\d{2}:\d{2}.\d{3}"
                placeholder='##:##.###'
                maxLength={9}
                onKeyDown={recordOnKeyDown}
                onInput={recordOnInput}
                onPaste={recordOnPaste}
                autoComplete="off" />
        </Editable>
    )
}