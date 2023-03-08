import { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useLoaderData, Form, redirect, useNavigation, useSubmit } from "react-router-dom";
import { getContacts, createContact } from "../contacts";

import { GoogleLogin, googleLogout } from '@react-oauth/google';
import * as jose from 'jose'

import { BsGlobe } from "react-icons/bs";

export async function action() {
    const contact = await createContact();
    return redirect(`/contacts/${contact.id}/edit`);
}

export async function loader({ request }) {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const contacts = await getContacts(q);
    return { contacts, q };
}

export default function Root() {
    const [credentials, setCredentials] = useState([]);

    const { contacts, q } = useLoaderData();
    const navigation = useNavigation();
    const submit = useSubmit();

    const searching =
        navigation.location &&
        new URLSearchParams(navigation.location.search).has(
            "q"
        );

    useEffect(() => {
        document.getElementById("q").value = q;
    }, [q]);

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
            <div id="sidebar">
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
            </div>
            <div id="detail"
                className={
                    navigation.state === "loading" ? "loading" : ""
                }>
                <Outlet />
            </div>
        </>
    );
}