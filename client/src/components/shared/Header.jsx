import { useState, useEffect } from 'react';
import { supabase } from '../../main';
import {
    Box,
    Flex,
    Avatar,
    HStack,
    Link,
    Icon,
    IconButton,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useDisclosure,
    useColorMode,
    useColorModeValue,
    Stack,
    Image,
    Tooltip,
    useToast
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, AddIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FcGoogle } from 'react-icons/fc';
import { NavLink } from 'react-router-dom';

const Links = [{
    name: "Tracks",
    link: "tracks"
},
{
    name: "Resources",
    link: "resources"
},
{
    name: "Changelog",
    link: "changelog"
}];

const NavLinkComponent = ({ children }) => (
    <Link as={NavLink}
        to={children.link}
        className={({ isActive, isPending }) => isActive ? "active" : isPending ? "pending" : ""}
        px={2}
        py={1}
        rounded={'md'}
        _hover={{
            textDecoration: 'none',
            bg: useColorModeValue('gray.200', 'gray.700'),
        }}
    >
        {children.name}
    </Link>
);

export default function Header(props) {
    const { colorMode, toggleColorMode } = useColorMode();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    async function signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            })
        } catch {

        }
    }

    async function signout() {
        try {
            const { error } = await supabase.auth.signOut();
        }
        catch {
            toast({
                description: "An error has occured attempting to sign out. Please try again.",
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <>
            <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
                <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                    <IconButton
                        size={'md'}
                        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                        aria-label={'Open Menu'}
                        display={{ md: 'none' }}
                        onClick={isOpen ? onClose : onOpen}
                    />
                    <HStack spacing={8} alignItems={'center'}>
                        <NavLink to="">
                            <Image src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/GrandPrix/GrandPrixImage_Emblem_A.png`} alt="KartRider Drift Logo" boxSize='42px' filter={colorMode === "light" ? "invert(1)" : ""} />
                        </NavLink>
                        <HStack
                            as={'nav'}
                            spacing={4}
                            display={{ base: 'none', md: 'flex' }}>
                            {Links.map((link) => (
                                <NavLinkComponent key={link.name}>{link}</NavLinkComponent>
                            ))}
                        </HStack>
                    </HStack>
                    <Flex alignItems={'center'}>
                        {/* Light/Dark Mode Toggle */}
                        <Tooltip label={colorMode === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}>
                            <Button mx={2} onClick={toggleColorMode}>
                                {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                            </Button>
                        </Tooltip>
                        {props.bErrorPage ? <></> :
                            props.session ? <Menu>
                                <MenuButton
                                    as={Button}
                                    rounded={'full'}
                                    variant={'link'}
                                    cursor={'pointer'}
                                    minW={0}>
                                    <Avatar
                                        size={'sm'}
                                        src={props?.user?.user_metadata?.avatar_url}
                                    />
                                </MenuButton>
                                <MenuList>
                                    <MenuItem onClick={() => supabase.auth.signOut()}>Sign Out</MenuItem>
                                </MenuList>
                            </Menu> : <Tooltip label="Sign in with Google">
                                <IconButton
                                    aria-label="Sign in with Google"
                                    icon={<Box as={FcGoogle} />}
                                    isRound border='1px'
                                    borderColor='gray.200'
                                    onClick={signInWithGoogle}
                                />
                            </Tooltip>
                        }
                    </Flex>
                </Flex>

                {/* Nav Dropdown when screen width is smaller */}
                {isOpen ? (
                    <Box pb={4} display={{ md: 'none' }}>
                        <Stack as={'nav'} spacing={4}>
                            {Links.map((link) => (
                                <NavLink key={link.name} to={link.link}>{link.name}</NavLink>
                            ))}
                        </Stack>
                    </Box>
                ) : null}
            </Box>
        </>
    );
}