import { KeyboardEventHandler, useEffect, useRef, useState } from 'react';
import { Listbox, ListboxItem } from '@heroui/react';
import { Input, Image } from '@heroui/react';
import {
  clipboardStore,
  isProgrammaticClipboardStore,
  settingStore,
} from '../store';
import { useAtom } from 'jotai';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { UnlistenFn } from '@tauri-apps/api/event';
import { useTheme } from '../hooks';
import { writeImageBase64, writeText } from 'tauri-plugin-clipboard-api';

const Clipboard = () => {
  const focusedUnlisten = useRef<UnlistenFn | undefined>(undefined);
  const [clipboard, setClipboard] = useAtom(clipboardStore);
  const [searchText, setSearchText] = useState('');
  const [setting] = useAtom(settingStore);
  const [isProgrammaticClipboard, setIsProgrammaticClipboard] = useAtom(
    isProgrammaticClipboardStore
  );
  const handleKeyDown: KeyboardEventHandler<HTMLUListElement> = e => {};
  const initFocusEvent = async () => {
    const currentWindow = await getCurrentWindow();
    const unlisten = await currentWindow.onFocusChanged(
      ({ payload: focused }) => {
        console.log('Focus changed, window is focused? ' + focused);
        if (!focused) {
          invoke('hide_panel');
        }
      }
    );

    // 添加窗口失去焦点的监听
    window.addEventListener('blur', () => {
      console.log('Window blur event triggered');
      invoke('hide_panel');
    });

    focusedUnlisten.current = () => {
      unlisten();
      window.removeEventListener('blur', () => invoke('hide_panel'));
    };
  };
  const dragEvent = (e: MouseEvent) => {
    // debugger
    if (e.buttons === 1) {
      // Primary (left) button
      e.detail === 2
        ? getCurrentWindow().toggleMaximize() // Maximize on double click
        : getCurrentWindow().startDragging(); // Else start dragging
    }
  };
  console.log(setting);

  useTheme();

  //   useEffect(() => {
  //     if (setting.theme === "dark") {
  //         document.documentElement.classList.remove("light");
  //         document.documentElement.classList.add("dark");
  //     } else {
  //         document.documentElement.classList.remove("dark");
  //         document.documentElement.classList.add("light");
  //     }
  // }, [setting.theme]);

  useEffect(() => {
    console.log('init');
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        invoke('hide_panel');
      }
    };

    initFocusEvent();
    // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
    //  unlisten();

    document
      .getElementById('clipboard-panel')
      ?.addEventListener('mousedown', dragEvent);

    document.documentElement.style.background = 'none';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      focusedUnlisten.current?.();
      window.removeEventListener('keydown', handleKeyDown);
      document
        .getElementById('clipboard-panel')
        ?.removeEventListener('mousedown', dragEvent);
    };
  }, []);

  const handleSearchKeyDown: KeyboardEventHandler<HTMLInputElement> = e => {
    // console.log(e.key);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const firstItem = document.querySelector(
        '[role="listbox"] [role="option"]'
      ) as HTMLElement;
      if (firstItem) {
        firstItem.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const items = document.querySelectorAll(
        '[role="listbox"] [role="option"]'
      );
      const lastItem = items[items.length - 1] as HTMLElement;
      if (lastItem) {
        lastItem.focus();
      }
    }
    if (e.key === 'Escape') {
      invoke('hide_panel');
    }
  };

  const filteredClipboard = clipboard.filter(item =>
    item.content.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div
      id="clipboard-panel"
      className={`${setting.theme} dark:bg-black dark:text-white light:bg-white  light:text-black  overflow-hidden flex flex-col  h-screen rounded-md`}
    >
      <Input
        onKeyDown={handleSearchKeyDown}
        placeholder="Search"
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
      />
      <Listbox
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto"
        aria-label="Actions"
        isVirtualized
          virtualization={{
          maxListboxHeight: 400,
          itemHeight: 40,
          }}
        // onAction={key => alert(key)}
      >
        {filteredClipboard.map((item, index) => (
          <ListboxItem
            id={item.id.toString()}
            data-index={index}
            onPress={async e => {
              const item =
                clipboard[
                  e.target.getAttribute('data-index') as unknown as number
                ];
              if (item) {
                invoke('hide_panel');
                if (item.type === 0) {
                  await writeText(item.content);
                } else if (item.type === 1) {
                  await writeImageBase64(item.content);
                }

                try {
                  setIsProgrammaticClipboard(true);
                  await invoke('paste');
                  setTimeout(() => {
                    setIsProgrammaticClipboard(false);
                  }, 500);
                } catch (error) {
                  setIsProgrammaticClipboard(false);
                }
              }

              // invoke('sendText', {
              //   name: clipboard[
              //     e.target.getAttribute('data-index') as unknown as number
              //   ].content,
              // });

              // writeText(clipboard[e.target.getAttribute('data-index') as unknown as number].content)
            }}
            key={item.id}
          >
            {item.type === 0 && (
              <span
              // className=' whitespace-nowrap  overflow-hidden text-ellipsis'
              >
                {item.content}
              </span>
            )}
            {item.type === 1 && (
              <Image
                width={100}
                src={`data:image/png;base64,${item.content}`}
              ></Image>
            )}

            {/* {item.content} */}
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
};

export default Clipboard;
