import React from 'react'
import ReactDOM from 'react-dom/client'

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { createClient } from '@supabase/supabase-js'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import './index.css'

// Chakra UI Color Mode
import theme from './theme'

// Routes
import Root, { loader as rootLoader } from "./routes/root";
import Index from "./routes/index";
import Tracks, { loader as tracksLoader } from "./routes/tracks";
import Records, { loader as recordsLoader } from "./routes/records";
import Resources, { loader as resourcesLoader } from "./routes/resources";
import Changelog from "./routes/changelog";

// Error Page
import ErrorPage from "./error-page";

// Create a single supabase client for interacting with your database
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PROJECT_API_KEY_PUBLIC)

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    id: "root",
    errorElement: <ErrorPage />,
    loader: rootLoader,
    children: [
      { index: true, element: <Index /> },
      {
        path: "tracks",
        element: <Tracks />,
        loader: tracksLoader,
      },
      {
        path: "tracks/:trackName",
        element: <Records />,
        loader: recordsLoader
      },
      {
        path: "resources",
        element: <Resources />,
        loader: resourcesLoader
      },
      {
        path: "changelog",
        element: <Changelog />,
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider>
      <RouterProvider router={router} />
    </ChakraProvider>
  </React.StrictMode>
);