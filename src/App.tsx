import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { emit, Event, listen, type UnlistenFn } from "@tauri-apps/api/event";
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
import { getUuiD, initDB, setAppConfig, setClientId } from "./utils";
import logo from "./assets/icon.png";
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
import Log from "./pages/log";

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

    const [clipboard, setClipboard] = useAtom(clipboardStorageStore);
    const [config] = useAtom(configStorageStore);

    const unlistenTextUpdate = useRef<UnlistenFn | null>(null);
    const unlistenImageUpdate = useRef<UnlistenFn | null>(null);
    const unlistenFileUpdate = useRef<UnlistenFn>(null);
    const unlistenClipboardEvent = useRef<UnlistenFn | null>(null);
    const unlistenPasteEvent = useRef<UnlistenFn | null>(null);
    const isListened = useRef(false);
    // const copyResult = useRef({ copyStarted: false, pasteStarted: false });
    const clipboardQueue = useRef<ClipboardQueue>([]);
    // const clientID = useRef();

    useEffect(() => {
        console.log(config);
        if (config) {
            setAppConfig(config);
        }
    }, [config]);

    const listenPasteEvent = async (event: Event<unknown>) => {
        // console.log(event);
        console.log("paste");
        const payload = JSON.parse(event.payload as string) as {
            clientId: string;
            value: string;
            id: string;
        };
        console.log(clipboardQueue);
        console.log(payload);

        if (payload.clientId !== window.clientId) {
            // console.log(111);
            if (
                !clipboardQueue.current.find((item) => {
                    return item.id === payload.id;
                })
            ) {
                console.log("push clip22");

                clipboardQueue.current.push({
                    value: payload.value,
                    id: payload.id,
                });
                console.log("write value:" + payload.value);
                await writeText(payload.value as string);
                Notification.success({
                    content: "copyed",
                });
            }
        }
        setClipboard(async (promiseValue) => {
            let value = await promiseValue;
            // console.log(value);
            return [...value, { value: payload.value }];
        });
    };

    const handleClickMenuItem = (
        key: string,
        event: any,
        keyPath: string[]
    ) => {
        setMenuIndex(key);
    };

    const listenClipboard = async () => {
        if (!isListened.current) {
            window.clientId = getUuiD(32);
            isListened.current = true;
            console.log("listen");
            // emit("set-client-id", window.clientId);

            setClientId(window.clientId);
            // setAppConfig(config);

            unlistenPasteEvent.current = await listen(
                "paste",
                listenPasteEvent
            );

            unlistenTextUpdate.current = await onTextUpdate((newText) => {
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
                            return item.id === id;
                        })
                    ) {
                        return;
                    }
                } catch (error) {
                    text = newText;
                    id = getUuiD(32);
                }

                if (
                    clipboardQueue.current.find((item) => {
                        return item.value === text;
                    })
                ) {
                    clipboardQueue.current = clipboardQueue.current.filter(
                        (item) => item.value !== text
                    );
                    return;
                }
                console.log("push clipbaord 11  ");

                clipboardQueue.current.push({
                    value: text,
                    id: id,
                });

                invoke("send_clipboard_event", {
                    value: text,
                    id: id,
                });
            });

            unlistenImageUpdate.current = await onImageUpdate(() => {
                console.log("copy image");
            });
            unlistenFileUpdate.current = await onFilesUpdate(() => {
                console.log("copy file");
            });
            unlistenClipboardEvent.current = await startListening();
        }
    };

    const unlistenClipboard = async () => {
        console.log(unlistenTextUpdate.current);
        unlistenTextUpdate.current();
        unlistenPasteEvent.current();
        unlistenClipboardEvent.current();
        unlistenFileUpdate.current();
        unlistenImageUpdate.current();
    };

    useMount(listenClipboard);

    useUnmount(unlistenClipboard);

    //

    useMount(() => {
        // initDB();
    });

    return (
        <Layout className=" h-full">
            <Layout>
                <Sider className="h-full ">
                    <div className="h-full flex flex-col">
                        <div className="py-2 flex justify-center items-center">
                            <img src={logo} className=" w-1/3" alt="" />
                        </div>
                        <Menu
                            mode="vertical"
                            onClickMenuItem={handleClickMenuItem}
                            defaultSelectedKeys={[menuIndex]}
                        >   
                            <MenuItem key="1">设置</MenuItem>
                            <MenuItem key="2">复制记录</MenuItem>
                            <MenuItem key="3">日志 </MenuItem>
                            <MenuItem key="4">关于</MenuItem>
                        </Menu>

                        <div className="text-center mt-auto">
                            <div>Infinited-Clipboard</div>
                            <div>0.0.1</div>
                        </div>
                    </div>
                </Sider>
                <Content>
                    <div className="container">
                        {menuIndex === "1" && <GeneralSetting></GeneralSetting>}
                        {menuIndex === "2" && <History></History>}
                        {menuIndex === "3" && <Log></Log>}
                        {menuIndex === "4" && <About></About>}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}

export default App;
