import { useEffect, useState, useRef } from "react";
import { Outlet } from "react-router-dom";
import { supabase } from "../main";

import { BsGlobe } from "react-icons/bs";

import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'

export async function loader({ request }) {
    let seasons = [];
    let countries = [];

    try {
        const { data: seasonsData, error: seasonsError } = await supabase.from('seasons').select();
        const { data: countriesData, error: countriesError } = await supabase.from('countries').select().order('Code');

        if (seasonsError) throw seasonsError;
        if (countriesError) throw countriesError;

        seasons = seasonsData;
        countries = countriesData;


    } catch (error) {
        console.error(error);
    }

    return { seasons, countries };
}

export default function Root() {
    // Store Google authentication session
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
    }, []);

    useEffect(() => {
        if (session && !user) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                setUser(user);
                localStorage.setItem("userID", user.id);
            });
        }
        else if (!session) {
            setUser(null);
            localStorage.removeItem("userID");
        }
    }, [session]);

    const detailRef = useRef(null);

    return (
        <>
            <Header session={session} user={user} bErrorPage={false}/>
            <div id="detail" ref={detailRef}
                className={
                    navigation.state === "loading" ? "loading" : ""
                }>
                <Outlet context={[detailRef, user]} />
            </div>
            <Footer />
        </>
    );
}