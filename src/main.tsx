import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import {NextUIProvider} from "@nextui-org/react";
import { ToastContainer, toast } from "react-toastify";



ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <NextUIProvider>
    <App />
    <ToastContainer />
  </NextUIProvider>
  // </React.StrictMode>,
);
