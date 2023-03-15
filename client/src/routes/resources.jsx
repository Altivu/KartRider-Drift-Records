import { useState } from 'react';
import { useLoaderData, useRouteLoaderData, useOutletContext } from "react-router-dom";
import { supabase } from "../main";

import { Heading, Table, TableContainer, Td, Thead, Tbody, Tr, HStack, Th, Text, Link } from '@chakra-ui/react';

import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { ExternalLinkIcon } from '@chakra-ui/icons';

export async function loader() {
    try {
        // The name ordering here is actually different from localeCompare in javascript...so force the javascript type
        const { data, error } = await supabase.from('resources').select().order('name');

        if (error) throw error;

        data.sort((a, b) => a.name.localeCompare(b.name));

        return data;
    }
    catch (error) {
        console.error(error)

        return [];
    }
}

export default function Resources() {
    const resources = useLoaderData();

    const [sortOptions, setSortOptions] = useState({
        column: "name",
        order: "Asc"
    });

    const COLUMNS = [
        { field: "name", columnName: "Name" },
        { field: "creator", columnName: "Creator" },
        { field: "language", columnName: "Language" },
        { field: "category", columnName: "Category" },
        { field: "type", columnName: "Type" },
        { field: "description", columnName: "Description" }
    ];

    // Logic when a user sorts by a column
    const updateSortOptions = (column) => {
        if (["description"].includes(column)) return;

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
                case "name": return a.name.localeCompare(b.name);
                case "creator": {
                    if (!a.creator && b.creator) {
                        return 1;
                    }
                    else if (a.creator && !b.creator) {
                        return -1;
                    }
                    else if (!a.creator && !b.creator) {
                        return a.name.localeCompare(b.name);
                    }
                    else {
                        return a.creator.localeCompare(b.creator) || a.name.localeCompare(b.name);
                    }
                }
                case "language": return a.language.localeCompare(b.language) || a.name.localeCompare(b.name);
                case "category": return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
                case "type": return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
            }
        }

        resources.sort((a, b) => {
            if (!order) return a.name.localeCompare(b.name);
            else if (order === "Asc") return sorter(a, b);
            else return sorter(b, a);
        });
    }

    // Get standard, up, or down sort icon based on sortOptions
    const getSortIcon = (column) => {
        if (["description"].includes(column)) return <></>;

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

    return (
        <>
            <Heading as='h3' size='lg' mt={4} mb={2}>Resources</Heading>
            <TableContainer whiteSpace="normal">
                <Table variant="simple">
                    <Thead>
                        <Tr>
                            {COLUMNS.map((column, index) => <Th key={index}>
                                <HStack>
                                    <Text fontSize='sm' style={{ cursor: !["description"].includes(column.field) ? "pointer" : "default" }} onClick={() => updateSortOptions(column.field)}>{column.columnName}</Text>
                                    {getSortIcon(column.field)}
                                </HStack>
                            </Th>)}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {
                            resources.map(resource => {
                                return (<Tr key={resource.id}>
                                    <Td><Link href={resource.url} isExternal>{resource.name}</Link><ExternalLinkIcon mx='2px' /></Td>
                                    <Td>{resource.creator}</Td>
                                    <Td>{resource.language}</Td>
                                    <Td>{resource.category}</Td>
                                    <Td>{resource.type}</Td>
                                    <Td>{resource.description}</Td>
                                </Tr>)
                            })
                        }
                    </Tbody>
                </Table>
            </TableContainer>
        </>
    );
}