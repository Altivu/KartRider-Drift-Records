import { Heading, Text, Divider, UnorderedList, ListItem } from '@chakra-ui/react';

export default function Changelog() {
    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Changelog</Heading>
            <Divider mb={4}/>

            <Text fontSize='lg'>[1.0.3] - March 22nd, 2023</Text>
            <UnorderedList>
                <ListItem>Added filters to tracks</ListItem>
                <UnorderedList>
                    <ListItem>Search by track name or theme (with 0.5 second delay)</ListItem>
                    <ListItem>Show Speed Grand Prix Tracks Only (some item tracks fall under this category...)</ListItem>
                    <ListItem>Show Records View (strips out extraneous track info and only shows the top saved record details)</ListItem>
                </UnorderedList>
            </UnorderedList>

            <Divider my={4}/>

            <Text fontSize='lg'>[1.0.2] - March 19th, 2023</Text>
            <UnorderedList>
                <ListItem>Fixed application not working in Firefox</ListItem>
            </UnorderedList>

            <Divider my={4}/>

            <Text fontSize='lg'>[1.0.1] - March 16th, 2023</Text>
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