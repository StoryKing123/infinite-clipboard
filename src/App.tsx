import { useEffect, useId, useRef, useState } from "react";
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
import logo from "./assets/icon.png";
import { fetch } from "@tauri-apps/plugin-http";

import { UnlistenFn } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";

import { useAtom } from "jotai";
import { authStore, clipboardStore, settingStore } from "./store";
import Database from "@tauri-apps/plugin-sql";
import { Button, Card, CardBody, Tab, Tabs, Image } from "@nextui-org/react";
import Setting from "./components/setting";
import ClipboardList from "./components/clipboardList";
import { toast } from "react-toastify";
import { info } from "@tauri-apps/plugin-log";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const unlistenClipboard = useRef<() => Promise<void>>(undefined);
  const unlistenTextUpdate = useRef<UnlistenFn>(undefined);
  const [auth, setAuth] = useAtom(authStore);
  const [setting, updateSetting] = useAtom(settingStore);
  const db = useRef<Database | undefined>(undefined);
  // const [clipboard, setClipboard] = useState<ClipboardEntry[]>([]);
  const [clipboard, setClipboard] = useAtom(clipboardStore);
  const clipboardRef = useRef<ClipboardEntry[]>([]);
  const [tabKey, setTabKey] = useState<string>("clipboard");
  const clinetid = useId();

  const initDB = async () => {
    const dbInstance = await Database.load("sqlite:app.db");
    db.current = dbInstance;
    await dbInstance.execute(`
      CREATE TABLE IF NOT EXISTS clipboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT,
          created_at DATETIME
      )
      `);
    const res = (await dbInstance.select(
      "SELECT * FROM clipboard"
    )) as ClipboardEntry[];
    setClipboard(res);

    // console.log(res);
    // const response = await fetch(
    //   "https://8080-idx-rust-1735789132880.cluster-mwrgkbggpvbq6tvtviraw2knqg.cloudworkstations.dev/connect"
    // );
    // const reader = response.body!.getReader();
    // while (true) {
    //   const { done, value } = await reader.read();
    //   if (done) break;
    //   const text = new TextDecoder().decode(value);
    //   console.log("Received:", text);
    // }
  };

  useEffect(() => {
    if (setting.theme === "dark") {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }
  }, [setting.theme]);

  useEffect(() => {
    clipboardRef.current = clipboard;
  }, [clipboard]);

  const handleGithubLogin = async () => {
    console.log("handleGithubLogin");
    const webview = new WebviewWindow("github-oauth", {
      url: "https://github.com/login/oauth/authorize?scope=user:email&client_id=Ov23lix14xI8yCaYz8cP",
      title: "GitHub Login",
      width: 800,
      height: 600,
      center: true,
    });
  };
  const handleClearHistory = async () => {
    await db.current?.execute("DELETE FROM clipboard");
    setClipboard([]);
  };

  const listenClipboard = async () => {
    unlistenTextUpdate.current = await onTextUpdate(async (newText) => {
      console.log(newText);

      // console.log(clipboard)
      // console.log(clipboard[clipboard.length - 1].content)
      console.log(clipboardRef.current);
      // console.log(clipboardRef.current[clipboardRef.current.length - 1].content );
      if (
        clipboardRef.current.length > 1 &&
        clipboardRef.current[0].content === newText
      ) {
        return;
      }
      const res = await db.current?.execute(
        "INSERT INTO clipboard (content, created_at) VALUES (?, ?)",
        [newText, new Date().toISOString()]
      );
      if (res && res.lastInsertId) {
        setClipboard((prev) => [
          {
            id: res.lastInsertId!,
            content: newText,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      // text = newText;
    });

    unlistenClipboard.current = await startListening();
    onClipboardUpdate(async () => {
      console.log("plugin:clipboard://clipboard-monitor/update event received");
    });
  };
  const initConnection = async () => {
    class EventSourceWithHeaders extends EventSource {
      constructor(url: string, headers: Record<string, string>) {
        const modifiedUrl = new URL(url);
        // 将headers添加为URL参数
        Object.entries(headers).forEach(([key, value]) => {
          modifiedUrl.searchParams.append(`header_${key}`, value);
        });
        super(modifiedUrl.toString());
      }
    }

    // let events = new EventSourceWithHeaders(
    //   "http://localhost:3000/events/connect?room_id=room1&client_id=client1",
    //   {
    //     "Authorization": `Bearer 321321`,
    //   }
    // );
    console.log("init connection");
    let response;
    let reader;

    try {
      response = await fetch(
        `http://localhost:3000/events/connect?room_id=room1&client_id=${clinetid}`,
        { headers: { Authorization: `Bearer 321321` } }
      );
      reader = response!.body!.getReader();
    } catch (error  ) {
      console.log(error);
      info((error as Error).message);
      toast("连接失败");
    }

    while (true) {
      const { done, value } = await reader!.read();
      console.log(done, value);
      if (done) break;
      const text = new TextDecoder().decode(value);
      console.log("Received:", text);
    }
    // events.onmessage = async (event) => {

    //   const data = event.data;

    //   const res = await db.current?.execute(
    //     "INSERT INTO clipboard (content, created_at) VALUES (?, ?)",
    //     [data, new Date().toISOString()]
    //   );
    //   if (res && res.lastInsertId) {
    //     setClipboard((prev) => [
    //       {
    //         id: res.lastInsertId!,
    //         content: data,
    //         created_at: new Date().toISOString(),
    //       },
    //       ...prev,
    //     ]);
    //   }

    // };
    // const response = await fetch(
    //   "https://8080-idx-rust-1735789132880.cluster-mwrgkbggpvbq6tvtviraw2knqg.cloudworkstations.dev/connect"
    // );
    // const reader = response.body!.getReader();
    // while (true) {
    //   const { done, value } = await reader.read();
    //   if (done) break;
    //   const text = new TextDecoder().decode(value);
    //   console.log("Received:", text);
    // }
  };
  useEffect(() => {
    listenClipboard();
    initDB();
    initConnection();
    // console.log("effect");
    // http

    return () => {
      unlistenClipboard.current?.();
      unlistenTextUpdate.current?.();
    };
  }, []);

  useEffect(() => {
    const unlisten = listen("oauth-callback", (event) => {
      const payload = event.payload as OAuthCallbackPayload;
      setAuth({
        token: payload.token,
        email: payload.email,
      });
      // 处理参数...
    });

    return () => {
      unlisten.then((f) => f()); // 清理监听器
    };
  }, []);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main
      className={`${setting.theme} dark:bg-black light:bg-white dark:text-white light:text-black h-screen w-screen flex flex-col  text-black`}
    >
      <div className="flex items-center">
        <div>
          <Image src={logo} alt="logo" width={32} height={32} />
        </div>
        {auth?.token ? (
          <div>{auth.email}</div>
        ) : (
          <Button
            className="ml-auto mr-2"
            color="primary"
            href="#"
            variant="flat"
            onPress={handleGithubLogin}
          >
            登录
          </Button>
        )}
      </div>
      <div className="flex-1 h-auto flex overflow-hidden">
        <div
          className="h-full"
          // style={{
          // minWidth: 150,
          // maxWidth: 200,
          // }}
        >
          <div className="flex items-center justify-center flex-col h-full">
            <div className="flex flex-col gap-2 w-full">
              <Tabs
                aria-label="Options"
                onSelectionChange={(e) => {
                  setTabKey(e as string);
                }}
                className="mx-2"
                defaultSelectedKey={tabKey}
                isVertical={true}
              >
                <Tab key="clipboard" className="w-[100px]" title="剪切板">
                  {/* <Card>
                      <CardBody>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                      </CardBody>
                    </Card> */}
                </Tab>
                <Tab key="setting" title="设置">
                  {/* <Card>
                      <CardBody>
                        Ut enim ad minim veniam, quis nostrud exercitation
                        ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        Duis aute irure dolor in reprehenderit in voluptate
                        velit esse cillum dolore eu fugiat nulla pariatur.
                      </CardBody>
                    </Card> */}
                </Tab>
                <Tab key="about" title="关于">
                  {/* <Card>
                      <CardBody>
                        Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum.
                      </CardBody>
                    </Card> */}
                </Tab>
              </Tabs>

              {/* {["剪切板", "设置", "关于"].map((item, index) => (
                  <div
                    onClick={() => setTabIndex(index.toString())}
                    key={item}
                    className={`w-full text-black cursor-pointer p-2 hover:bg-gray-100`}
                  >
                    {item}
                  </div>
                ))} */}
            </div>

            <div className="mt-auto mb-2 flex items-center justify-center gap-2">
              <div
                className="cursor-pointer"
                onClick={handleGithubLogin}
                style={{ fontSize: 24 }}
              >
                {/* GitHub */}
              </div>
              {/* {auth?.token ? <div>{auth.email}</div> : null} */}
            </div>
          </div>
        </div>
        <div className="h-full  flex-1 overflow-hidden ">
          {tabKey === "clipboard" && <ClipboardList db={db.current} />}
          {tabKey === "setting" && <Setting />}
        </div>
      </div>
    </main>
  );
}

export default App;
