import { useRouteError } from "react-router-dom";

import Header from './components/shared/Header'
import Footer from './components/shared/Footer'

export default function ErrorPage() {
  const error = useRouteError();
  
  return (
    <>
      <Header bErrorPage={true} />
      <div id="detail">
        {/access_token=.*refresh_token=.*token_type=/.test(error.data) ? <></> : <p>An unexpected error has occurred. Please return to the previous page.</p>}
      </div>
      <Footer />
    </>
  );
}