import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useMount, useUnmount } from "ahooks";
import {
    Tabs,
    Typography,
    Button,
    Menu,
    Layout,
    Notification,
} from "@arco-design/web-react";
import { useAtom } from "jotai";
import "./App.css";
import GeneralSetting from "./components/setting/generalSetting";
import About from "./components/setting/about";
// import { configAtom } from "./store";
import { getUuiD, initDB } from "./utils";
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
import { clipboardStorageStore, configStorageStore } from "./store";
import History from "./components/setting/history";

const Sider = Layout.Sider;
const Header = Layout.Header;
const Footer = Layout.Footer;
const Content = Layout.Content;

const MenuItem = Menu.Item;
const SubMenu = Menu.SubMenu;

const TabPane = Tabs.TabPane;
const style = {
    textAlign: "center",
    marginTop: 20,
} as any;
type ClipboardQueue = {
    value: string;
    id: string;
}[];
function App() {
    const [menuIndex, setMenuIndex] = useState("1");
    // const [atom] = useAtom(configAtom);

    const [clipboard, setClipboard] = useAtom(clipboardStorageStore);
    // console.log(atom);
    const [config] = useAtom(configStorageStore);

    useEffect(() => {
        console.log("update config");
    }, [config]);

    const unlistenTextUpdate = useRef<UnlistenFn | null>(null);
    const unlistenClipboardEvent = useRef<UnlistenFn | null>(null);
    const unlistenPasteEvent = useRef<UnlistenFn | null>(null);
    const isListened = useRef(false);
    // const copyResult = useRef({ copyStarted: false, pasteStarted: false });
    const clipboardQueue = useRef<ClipboardQueue>([]);
    // const clientID = useRef();

    const handleClickMenuItem = (
        key: string,
        event: any,
        keyPath: string[]
    ) => {
        // console.log(key);
        // console.log(event);
        // console.log(keyPath);
        setMenuIndex(key);
    };

    const listenClipboard = async () => {
        if (!isListened.current) {
            window.clientId = getUuiD(32);
            isListened.current = true;
            console.log("listen");
            // emit("set-client-id", window.clientId);

            invoke("set_client_id", {
                id: window.clientId,
            });

            unlistenPasteEvent.current = await listen(
                "paste",
                async (event) => {
                    // copyResult.current.pasteStarted = true;
                    console.log(event);
                    console.log("paste");
                    console.log(clipboardQueue);
                    const payload = JSON.parse(event.payload as string) as {
                        clientId: string;
                        value: string;
                        id: string;
                    };

                    if (payload.clientId !== window.clientId) {
                        if (
                            clipboardQueue.current.find((item) => {
                                item.id !== payload.id;
                            })
                        ) {
                            Notification.success({
                                content: "copyed",
                            });
                            clipboardQueue.current.push({
                                value: payload.value,
                                id: payload.id,
                            });
                            console.log("write value:" + payload.value);
                            await writeText(event.payload as string);
                        }
                    }
                    setClipboard(async (promiseValue) => {
                        let value = await promiseValue;
                        console.log(value);

                        return [...value, { value: payload.value }];
                    });
                }
            );

            unlistenTextUpdate.current = await onTextUpdate((newText) => {
                // text = newText;
                console.log("start to paste");
                console.log(newText);
                let text = "";
                let id = "";
                // copyResult.current.copyStarted = true;
                try {
                    let textObj = JSON.parse(newText);
                    id = textObj.id;
                    text = textObj.value;
                    if (
                        clipboardQueue.current.find((item) => {
                            item.id === id;
                        })
                    ) {
                        return;
                    }
                } catch (error) {
                    text = newText;
                    id = getUuiD(32);
                }

                clipboardQueue.current.push({
                    value: text,
                    id: id,
                });
                invoke("send_clipboard_event", {
                    value: text,
                    id: id,
                    // created:'infinited-clipboard'
                });
            });
            unlistenClipboardEvent.current = await startListening();
        }
    };

    const unlistenClipboard = async () => {
        console.log(unlistenTextUpdate.current);
        unlistenTextUpdate.current!();
        unlistenPasteEvent.current!();
        unlistenClipboardEvent.current!();
    };

    useMount(listenClipboard);

    useUnmount(unlistenClipboard);

    //

    useMount(() => {
        // initDB();
    });

    return (
        <Layout className=" h-full">
            {/* <Header>Header</Header> */}
            <Layout>
                <Sider className="h-full">
                    <Menu
                        mode="vertical"
                        onClickMenuItem={handleClickMenuItem}
                        defaultSelectedKeys={[menuIndex]}
                    >
                        <MenuItem key="1">设置</MenuItem>
                        <MenuItem key="2">复制记录</MenuItem>
                        <MenuItem key="3">Cloud </MenuItem>
                        <MenuItem key="4">关于</MenuItem>
                    </Menu>
                </Sider>
                <Content>
                    {/* <div
                        style={{
                            width: 80,
                            height: 30,
                            borderRadius: 2,
                            background: "var(--color-fill-3)",
                            cursor: "text",
                        }}
                    /> */}
                    <div className="container">
                        {menuIndex === "1" && <GeneralSetting></GeneralSetting>}
                        {menuIndex === "2" && <History></History>}
                        {menuIndex === "4" && <About></About>}
                    </div>
                </Content>
            </Layout>
            {/* <Footer>Footer</Footer> */}
        </Layout>
    );
}

export default App;
