import { useEffect, useId, useRef, useState } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import logo from './assets/icon.png';
import { listen } from '@tauri-apps/api/event';
import { useAtom } from 'jotai';
import {
  appAtom,
  authStore,
  connectionStore,
  insertClipboard,
  settingStore,
} from './store';
import Database from '@tauri-apps/plugin-sql';
import { Button, Chip, Image, Tab, Tabs } from '@heroui/react';
import Setting from './components/setting';
import ClipboardList from './components/clipboardList';
import { useTheme } from './hooks';
import { About } from './components/about';
import {
  isRegistered,
  register,
  unregister,
} from '@tauri-apps/plugin-global-shortcut';
import { useClipboard } from './hooks/useClipboard';
import { OAuthCallbackPayload } from './types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './hooks/useLanguage';
import { useTray } from './hooks/useTray';
import { getCurrentWindow } from '@tauri-apps/api/window';
import axios from 'axios';
import { toast } from 'react-toastify';
import { nanoid } from 'nanoid';
import UserSVG from './assets/user.svg';
import Device from './components/device';
import Shortcut from './components/shortcut';
import { useShortcut } from './hooks/useShortcut';

function App() {
  const [auth, setAuth] = useAtom(authStore);
  const [setting, updateSetting] = useAtom(settingStore);
  const db = useRef<Database | undefined>(undefined);
  const [tabKey, setTabKey] = useState<string>('clipboard');
  const { t, i18n } = useTranslation();
  // const clientid = useId();
  const clientid = setting.id;
  const [connection, setConnection] = useAtom(connectionStore);
  const { clipboard: clipboardData, insertClipbaord } = useClipboard();
  const [, insert] = useAtom(insertClipboard);
  const [app, setApp] = useAtom(appAtom);
  const initAtom = async () => {
    console.log('atom:!');
    const res = (await invoke(
      'generate_x25519_key_secret'
    )) as invokeGenerateX25519KeySecretRes;
    console.log(res);
    setApp({ secretBase64: res.secret, publicKeyBase64: res.key });
  };
  useEffect(() => {
    if (!app) {
      initAtom();
    }
  }, [app]);

  useTheme();
  useLanguage();

  // 初始化数据库
  const initDB = async () => {
    const dbInstance = await Database.load('sqlite:app.db');
    db.current = dbInstance;
  };

  // 处理 GitHub 登录
  const handleGithubLogin = async () => {
    const auth0Domain = 'dev-gc80uo0lkw38p6fm.us.auth0.com';
    const auth0ClientId = 'iYJHTznuBHb33JBGxjTbNKG8pMiJCqaj';
    const redirectUri = encodeURIComponent(
      window.location.origin + '/callback'
    );
    // const redirectUri = encodeURIComponent('http://localhost:3000/auth/callback' );

    console.log(redirectUri);
    // debugger

    const auth0Url = `https://${auth0Domain}/authorize?response_type=code&client_id=${auth0ClientId}&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;
    // window.location.href = auth0Url;

    new WebviewWindow('github-oauth', {
      // url: 'https://github.com/login/oauth/authorize?scope=user:email&client_id=Ov23lix14xI8yCaYz8cP',
      url: auth0Url,
      title: 'GitHub Login',
      width: 800,
      height: 600,
      center: true,
    });
  };

  // 初始化快捷键
  const initShortcut = async () => {
    const key = 'Command+Shift+L';
    await unregister(key);

    const isKeyRegistered = await isRegistered(key);
    if (!isKeyRegistered) {
      await register(key, async event => {
        if (event.state === 'Pressed') {
          invoke('show_panel');
        }
      });
    }
  };
  const initSetting = () => {
    if (!setting.language) {
      updateSetting({ ...setting, language: i18n.language });
    }
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

    let events = new EventSourceWithHeaders(
      // `http://localhost:3000/events/connect?room_id=${auth?.email}&client_id=${clientid}`,
      `${import.meta.env.VITE_API_URL}/events/connect?room_id=${
        auth?.email
      }&client_id=${clientid}&public_key=${app.publicKeyBase64}`,
      {
        Authorization: `Bearer 321321`,
      }
    );
    events.addEventListener('connection', function (event) {
      // event.data 中包含了服务器发送的事件数据，这里应该是 "Connected to room: room1"
      const connectionMessage = event.data;
      console.log(connectionMessage);
      const initRes = JSON.parse(connectionMessage) as { devices: any[] };
      setConnection({
        id: 'client1',
        room: auth?.email,
        status: 1,
        devices: initRes.devices,
      });
      axios
        .get(
          // `http://localhost:3000/events/connection/update/${auth?.email}/${clientid}`
          `${import.meta.env.VITE_API_URL}/events/connection/update/${
            auth?.email
          }/${clientid}`
        )
        .then(res => {
          console.log(res);
        });
      // console.log('SSE Connection Message:', connectionMessage); // 输出：SSE Connection Message: Connected to room: room1

      // 在这里您可以进一步处理这个消息，例如更新 UI 显示连接状态
    });

    events.onopen = e => {
      console.log(e);
      console.log('连接成功');
    };
    console.log('init connection');
    // let response;
    // let reader;

    // try {
    //   response = await fetch(
    //     `http://localhost:3000/events/connect?room_id=room1&client_id=111`
    //     // { headers: { Authorization: `Bearer 321321` } }
    //   );
    //   console.log('连接成功')
    //   reader = response!.body!.getReader();
    // } catch (error  ) {
    //   console.log(error);
    //   info((error as Error).message);
    //   toast("连接失败");
    // }

    // while (true) {
    //   const { done, value } = await reader!.read();
    //   console.log(done, value);
    //   if (done) break;
    //   const text = new TextDecoder().decode(value);
    //   console.log("Received:", text);
    // }
    events.onerror = async event => {
      console.log(event);
      toast.error('连接失败');
      setConnection(undefined);
      events.close();
    };

    events.onmessage = async event => {
      // console.log(event)
      const data = event.data;
      const res = JSON.parse(data) as { action: string; message: any };
      console.log('on message');
      console.log(res);
      if (res.action === 'update_connection') {
        setConnection({
          id: 'client1',
          room: auth?.email,
          status: 1,
          devices: res.message.devices,
        });
      }
      if (res.action === 'receive_message') {
        // insert()
        insert([
          {
            content: res.message.data,
            type: res.message.type,
            created_at: new Date().toISOString(),
          },
        ]);
        // debugger
        // insertClipbaord(res.message);
      }
      // console.log(data);

      // const res = await db.current?.execute(
      //   'INSERT INTO clipboard (content, created_at) VALUES (?, ?)',
      //   [data, new Date().toISOString()]
      // );
      // if (res && res.lastInsertId) {
      //   setClipboard(prev => [
      //     {
      //       id: res.lastInsertId!,
      //       content: data,
      //       created_at: new Date().toISOString(),
      //     },
      //     ...prev,
      //   ]);
      // }
    };
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
  useTray();
  useShortcut();

  // console.log(connection)

  // const initOnClose = () => {
  //   appWindow.onCloseRequested(async (event) => {
  //     event.preventDefault(); // 阻止默认关闭行为
  //     await appWindow.hide(); // 隐藏窗口
  //   });
  // };

  // 初始化
  useEffect(() => {
    initDB();
    initShortcut();
    initSetting();

    updateSetting({ ...setting });
    // initConnectionID();
    // initOnClose();
  }, []);

  useEffect(() => {
    if (auth?.email && app.publicKeyBase64) {
      initConnection();
    }
  }, [auth?.email, app.publicKeyBase64]);

  const initEvent = async () => {};

  // 监听 OAuth 回调
  useEffect(() => {
    const closeUnlisten = getCurrentWindow().onCloseRequested(async event => {
      event.preventDefault();
      getCurrentWindow().hide();
    });

    const unlisten = listen('oauth-callback', event => {
      const payload = event.payload as OAuthCallbackPayload;
      setAuth({
        token: payload.token,
        email: payload.email,
      });
    });

    return () => {
      closeUnlisten.then(f => f());
      unlisten.then(f => f());
    };
  }, []);

  // 使用剪贴板 hook

  return (
    <main
      className={`${setting.theme} dark:bg-black light:bg-white dark:text-white light:text-black h-screen w-screen flex flex-col`}
    >
      {/* Header */}
      <header className="flex items-center">
        <div>
          {/* <Image src={logo} alt="logo" width={32} height={32} /> */}
        </div>
        <div className=" mt-2 ml-auto mr-2">
          {auth?.token ? (
            <Chip
              variant="flat"
              avatar={<Image src={UserSVG} width={32} height={32}></Image>}
            >
              <div className="flex flex-2 items-center">
                {/* */}
                {/* <UserSVG /> */}
                <div> {auth.email}</div>
              </div>
            </Chip>
          ) : (
            <Button
              className="ml-auto mr-2"
              color="primary"
              href="#"
              variant="flat"
              onPress={() => {
                if (auth && auth.email) {
                  handleGithubLogin();
                } else {
                  initConnection();
                }
              }}
            >
              登录
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 h-auto flex overflow-hidden">
        {/* Sidebar */}
        <nav className="h-full">
          <div className="flex items-center justify-center flex-col h-full">
            <Tabs
              aria-label="Options"
              onSelectionChange={key => setTabKey(key as string)}
              className="mx-2"
              defaultSelectedKey={tabKey}
              isVertical={true}
            >
              <Tab key="clipboard" className="w-[100px]" title="剪切板" />
              <Tab key="setting" title="设置" />
              <Tab key="device" title="设备" />
              <Tab key="shortcut" title="快捷键" />
              <Tab key="about" title="关于" />
            </Tabs>
            <div className="mt-2 cursor-pointer">
              <Chip variant="flat">
                <div className="flex gap-2 items-center">
                  <div
                    className={`${
                      connection?.status === 1 ? 'bg-green-500' : 'bg-red-500'
                    } rounded-full w-2 h-2 aspect-square`}
                  ></div>{' '}
                  <div>
                    {connection?.status === 1
                      ? `${connection.devices?.length}台设备在线`
                      : '未连接'}{' '}
                  </div>
                </div>
              </Chip>
            </div>
            {connection?.status !== 1 && (
              <div className="mt-2 cursor-pointer">
                <Chip variant="flat">
                  <div
                    onClick={() => {
                      if (auth && auth.email) {
                        initConnection();
                      } else {
                        handleGithubLogin();
                      }
                    }}
                    className="flex gap-2 items-center"
                  >
                    {auth && auth.email ? '重试' : '登录'}
                  </div>
                </Chip>
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <div className="h-full flex-1 overflow-hidden">
          {tabKey === 'clipboard' && <ClipboardList db={db.current} />}
          {tabKey === 'setting' && <Setting />}
          {tabKey === 'shortcut' && <Shortcut />}
          {tabKey === 'about' && <About />}
          {tabKey === 'device' && <Device />}
        </div>
      </div>
    </main>
  );
}

export default App;
