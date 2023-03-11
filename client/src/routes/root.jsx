import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, Link, useLoaderData, Form, redirect, useNavigation, useSubmit } from "react-router-dom";
import { getContacts, createContact } from "../contacts";

import { GoogleLogin, googleLogout } from '@react-oauth/google';
import * as jose from 'jose'

import { BsGlobe } from "react-icons/bs";

import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'

export async function action() {
    const contact = await createContact();
    return redirect(`/contacts/${contact.id}/edit`);
}

export async function loader({ request }) {
    let { seasons, languages, countries } = [];

    try {
        // Yes I know this looks kind of ridiculous
        seasons = await (await fetch(`${import.meta.env.VITE_SERVER_URL}/seasons`)).json();
        languages = await (await fetch(`${import.meta.env.VITE_SERVER_URL}/languages`)).json();
        countries = await (await (fetch(`${import.meta.env.VITE_SERVER_URL}/countries`))).json();
    } catch {

    }

    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const contacts = await getContacts(q);
    return { contacts, q, seasons, languages, countries };
}

export default function Root() {
    // Store Google authentication credentials
    const [credentials, setCredentials] = useState([]);

    const { contacts, q, seasons } = useLoaderData();
    const navigation = useNavigation();
    const submit = useSubmit();

    const detailRef = useRef(null);

    const searching =
        navigation.location &&
        new URLSearchParams(navigation.location.search).has(
            "q"
        );

    // useEffect(() => {
    //     document.getElementById("q").value = q;
    // }, [q]);

    const logOut = () => {
        googleLogout();
        setCredentials(null);
    }

    // Google successful login
    const responseMessage = (response) => {
        setCredentials(jose.decodeJwt(response.credential));
        console.log(credentials)
    };

    // Google error during login
    const errorMessage = (error) => {
        console.log(error);
    };

    return (
        <>
            <Header />
            {/* <nav>
                <NavLink to="">
                    <img src={`${import.meta.env.VITE_ASSETS_GITHUB_URL}/GrandPrix/GrandPrixImage_Emblem_A.png`} className="emblemImage" />
                </NavLink>
                <ul>
                    <li><NavLink to="tracks" className={({ isActive, isPending }) =>
                        isActive
                            ? "active"
                            : isPending
                                ? "pending"
                                : ""}>Tracks</NavLink></li>
                </ul>
                <button><BsGlobe /></button>
                <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
            </nav> */}
            {/* <div id="sidebar">
                <h1>React Router Contacts</h1>
                <GoogleLogin onSuccess={responseMessage} onError={errorMessage} />
                <button onClick={logOut}>Log Out</button>
                <button id="localizationButton">
                    <BsGlobe />
                </button>
                <div>
                    <Form id="search-form" role="search">
                        <input
                            id="q"
                            className={searching ? "loading" : ""}
                            aria-label="Search contacts"
                            placeholder="Search"
                            type="search"
                            name="q"
                            defaultValue={q}
                            onChange={(event) => {
                                const isFirstSearch = q == null;
                                submit(event.currentTarget.form, {
                                    replace: !isFirstSearch,
                                });
                            }}
                        />
                        <div
                            id="search-spinner"
                            aria-hidden
                            hidden={!searching}
                        />
                        <div
                            className="sr-only"
                            aria-live="polite"
                        ></div>
                    </Form>
                    <Form method="post">
                        <button type="submit">New</button>
                    </Form>
                </div>
                <nav>
                    {contacts.length ? (
                        <ul>
                            {contacts.map((contact) => (
                                <li key={contact.id}>
                                    <NavLink
                                        to={`contacts/${contact.id}`}
                                        className={({ isActive, isPending }) =>
                                            isActive
                                                ? "active"
                                                : isPending
                                                    ? "pending"
                                                    : ""
                                        }
                                    >
                                        {contact.first || contact.last ? (
                                            <>
                                                {contact.first} {contact.last}
                                            </>
                                        ) : (
                                            <i>No Name</i>
                                        )}{" "}
                                        {contact.favorite && <span>★</span>}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>
                            <i>No contacts</i>
                        </p>
                    )}
                </nav>
            </div> */}


            <div id="detail" ref={detailRef}
                className={
                    navigation.state === "loading" ? "loading" : ""
                }>
                <Outlet context={detailRef} />
            </div>

            <Footer />

            {/* <footer>
                <p>Website created in React by AltiV.</p>
            </footer> */}
        </>
    );
}