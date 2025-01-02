import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import {
  onClipboardUpdate,
  onImageUpdate,
  onTextUpdate,
  onHTMLUpdate,
  onRTFUpdate,
  onFilesUpdate,
  startListening,
  listenToMonitorStatusUpdate,
  isMonitorRunning,
  hasHTML,
  hasImage,
  hasText,
  hasRTF,
  hasFiles,
} from "tauri-plugin-clipboard-api";

import "./App.css";
import { UnlistenFn } from "@tauri-apps/api/event";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const unlistenClipboard = useRef<() => Promise<void> >(undefined);
  const unlistenTextUpdate = useRef<UnlistenFn>(undefined);

  const listen = async () => {
    unlistenTextUpdate.current = await onTextUpdate((newText) => {
      console.log(newText);
      // text = newText;
    });

    unlistenClipboard.current = await startListening();
    onClipboardUpdate(async () => {
      console.log("plugin:clipboard://clipboard-monitor/update event received");
    });
  };
  useEffect(() => {
    listen();
    console.log("effect");

    return () => {
      unlistenClipboard.current?.();
      unlistenTextUpdate.current?.();
    };
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>
      {/* <a ></a> */}
      <p>
        We're going to now talk to the GitHub API. Ready?
        <a href="https://github.com/login/oauth/authorize?scope=user:email&client_id=Ov23lix14xI8yCaYz8cP">
          Click here
        </a>{" "}
        to begin!
      </p>
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
        <button onClick={async () => {
          const res = await fetch('http://infiniteclipboard.local/callback');
          res.json()
        }}>call</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
