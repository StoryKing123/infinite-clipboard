import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import "./App.css";
import { useMount, useUnmount } from "ahooks";
import {
    onClipboardUpdate,
    onImageUpdate,
    onTextUpdate,
    onFilesUpdate,
    startListening,
    listenToMonitorStatusUpdate,
    isMonitorRunning,
    writeText,
} from "tauri-plugin-clipboard-api";
import { getUuiD } from "./utils";

function App() {
    const [greetMsg, setGreetMsg] = useState("");
    const [name, setName] = useState("");
    // const unlistenTextUpdate = useRef<UnlistenFn | null>(null);
    // const unlistenClipboardEvent = useRef<UnlistenFn | null>(null);
    // const unlistenPasteEvent = useRef<UnlistenFn | null>(null);
    // const isListened = useRef(false);
    // const copyResult = useRef({ copyStarted: false, pasteStarted: false });
    // // const clientID = useRef();

    // const listenClipboard = async () => {
    //     if (!isListened.current) {
    //         window.clientId = getUuiD(32);
    //         isListened.current = true;
    //         console.log("listen");
    //         // emit("set-client-id", window.clientId);

    //         invoke("set_client_id", {
    //             id: window.clientId,
    //         });

    //         unlistenPasteEvent.current = await listen(
    //             "paste",
    //             async (event) => {
    //                 copyResult.current.pasteStarted = true;
    //                 console.log(event);
    //                 console.log("paste");
    //                 if ((copyResult.current.copyStarted = false)) {
    //                 }
    //                 const payload = JSON.parse(event.payload as string) as {
    //                     clientId: string;
    //                     value: string;
    //                 };
    //                 if (payload.clientId !== window.clientId) {
    //                     await writeText(payload.value);
    //                 }

    //                 //finished event
    //                 copyResult.current.pasteStarted = false;
    //                 copyResult.current.copyStarted = false;
    //                 // event.event is the event name (useful if you want to use a single callback fn for multiple event types)
    //                 // event.payload is the payload object
    //             }
    //         );

    //         unlistenTextUpdate.current = await onTextUpdate((newText) => {
    //             // text = newText;
    //             console.log(newText);
    //             copyResult.current.copyStarted = true;
    //             invoke("send_clipboard_event", {
    //                 value: newText,
    //                 id: window.clientId,
    //             });
    //         });
    //         unlistenClipboardEvent.current = await startListening();
    //     }
    // };

    // const unlistenClipboard = async () => {
    //     console.log(unlistenTextUpdate.current);
    //     unlistenTextUpdate.current!();
    //     unlistenPasteEvent.current!();
    //     unlistenClipboardEvent.current!();
    // };

    // useMount(listenClipboard);

    // useUnmount(unlistenClipboard);

    // useEffect(() => {
    //     return () => {};
    // }, []);

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
        setGreetMsg(await invoke("greet", { name }));
    }

    return (
        <div className="container">
            <h1>Welcome to Tauri!</h1>

            <div className="row">
                <a href="https://vitejs.dev" target="_blank">
                    <img
                        src="/vite.svg"
                        className="logo vite"
                        alt="Vite logo"
                    />
                </a>
                <a href="https://tauri.app" target="_blank">
                    <img
                        src="/tauri.svg"
                        className="logo tauri"
                        alt="Tauri logo"
                    />
                </a>
                <a href="https://reactjs.org" target="_blank">
                    <img
                        src={reactLogo}
                        className="logo react"
                        alt="React logo"
                    />
                </a>
            </div>

            <p>Click on the Tauri, Vite, and React logos to learn more.</p>

            <form
                className="row"
                onSubmit={(e) => {
                    e.preventDefault();
                    greet();
                }}
            >
                <input
                    id="greet-input"
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Enter a name..."
                />
                <button type="submit">Greet</button>
            </form>

            <p>{greetMsg}</p>
        </div>
    );
}

export default App;
