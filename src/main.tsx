import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import './i18n'
import {HeroUIProvider} from "@heroui/react";
import { ToastContainer, toast } from "react-toastify";
import { BrowserRouter, Route, Routes } from "react-router";
import ClipboardList from "./pages/clipboard";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <HeroUIProvider>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/clipboard" element={<ClipboardList />} />
    </Routes>
      {/* <App /> */}
    </BrowserRouter>
    <ToastContainer />
  </HeroUIProvider>
  // </React.StrictMode>,
);
