import { Navbar } from "../components/layout/Navbar";
import { HomePage } from "../pages/home/HomePage";

export function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <HomePage />
    </>
  );
}
