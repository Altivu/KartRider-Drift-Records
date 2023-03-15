import { Heading, Table, TableContainer, Td, Thead, Tbody, Tr, HStack, Th, Text, Link, Divider } from '@chakra-ui/react';

export default function Changelog() {
    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Changelog</Heading>
            <Divider />

            <Text fontSize='lg'>[1.0.0] - March 15th, 2023</Text>
            <Text fontSize='md'>General release of application.</Text>
        </>
    );
}