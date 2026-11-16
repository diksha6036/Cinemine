import { createBrowserRouter } from "react-router-dom";
import { App } from "./App";
import { HomePage } from "../pages/home/HomePage";
import { MoviePage } from "../pages/movie/MoviePage";
import { CalendarPage } from "../features/calendar/CalendarPage";

export const router = createBrowserRouter([{ element: <App />, children: [{ path: "/", element: <HomePage /> }, { path: "/calendar", element: <CalendarPage /> }, { path: "/movie/:id", element: <MoviePage /> }] }]);
