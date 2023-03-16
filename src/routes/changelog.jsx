import { Heading, Table, TableContainer, Td, Thead, Tbody, Tr, HStack, Th, Text, Link, Divider, List, UnorderedList, ListItem } from '@chakra-ui/react';

export default function Changelog() {
    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Changelog</Heading>
            <Divider mb={4}/>

            <Text fontSize='lg'>[1.1.0] - March 16th, 2023</Text>
            <UnorderedList>
                <ListItem>Added basic video embed for Bilibili URLs</ListItem>
                <ListItem>Added logged in email information to header dropdown</ListItem>
                <UnorderedList>
                    <ListItem>This acts as an additional indicator of what account you're using in case the avatar image does not properly load</ListItem>
                </UnorderedList>
            </UnorderedList>

            <Divider my={4}/>

            <Text fontSize='lg'>[1.0.0] - March 15th, 2023</Text>
            <Text fontSize='md'>General release of application.</Text>
        </>
    );
}