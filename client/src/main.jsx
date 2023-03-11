import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import './index.css'

// Chakra UI Color Mode
import theme from './theme'

// Routes
import Root, { loader as rootLoader, action as rootAction } from "./routes/root";
import Contact, { loader as contactLoader } from "./routes/contact";
import EditContact, { action as editAction } from "./routes/edit";
import { action as destroyAction } from "./routes/destroy";
import Index from "./routes/index";
import Tracks, { loader as tracksLoader } from "./routes/tracks";
import Records, { loader as recordsLoader } from "./routes/records";

// Error Page
import ErrorPage from "./error-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    id: "root",
    errorElement: <ErrorPage />,
    loader: rootLoader,
    action: rootAction,
    children: [
      { index: true, element: <Index /> },
      {
        path: "contacts/:contactId",
        element: <Contact />,
        loader: contactLoader,
      },
      {
        path: "contacts/:contactId/edit",
        element: <EditContact />,
        loader: contactLoader,
        action: editAction
      },
      {
        path: "contacts/:contactId/destroy",
        action: destroyAction,
        errorElement: <div>Oops! There was an error.</div>,
      },
      {
        path: "tracks",
        element: <Tracks />,
        loader: tracksLoader,
      },
      {
        path: "tracks/:trackID",
        element: <Records />,
        loader: recordsLoader
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <React.StrictMode>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider>
        <RouterProvider router={router} />
      </ChakraProvider>
    </React.StrictMode>
  </GoogleOAuthProvider>,
)
