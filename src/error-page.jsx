import { useRouteError } from "react-router-dom";

import Header from './components/shared/Header'
import Footer from './components/shared/Footer'

export default function ErrorPage() {
  // const error = useRouteError();
  // console.error(error);

  return (
    <>
      <Header bErrorPage={true} />
      <div id="detail">
        <p>An unexpected error has occurred. Please return to the previous page.</p>
      </div>
      <Footer />
    </>
  );
}