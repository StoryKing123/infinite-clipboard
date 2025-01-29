import { KeyboardEventHandler, useEffect, useRef, useState } from 'react';
import { Listbox, ListboxSection, ListboxItem } from '@heroui/listbox';
import { Input } from '@heroui/react';
import { clipboardStore } from '../store';
import { useAtom } from 'jotai';
import { register } from '@tauri-apps/plugin-global-shortcut';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { writeText } from 'tauri-plugin-clipboard-api';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { UnlistenFn } from '@tauri-apps/api/event';

const Clipboard = () => {
  const focusedUnlisten = useRef<UnlistenFn | undefined>(undefined);
  const [clipboard, setClipboard] = useAtom(clipboardStore);
  const [searchText, setSearchText] = useState('');
  const handleKeyDown: KeyboardEventHandler<HTMLUListElement> = e => {
    // console.log(e.key);
    // if (e.key === 'Enter') {
    //   e.preventDefault();
    //   const focusedItem = document.querySelector('[aria-selected="true"]');
    //   if (focusedItem) {
    //     const content = focusedItem.textContent;
    //     console.log('选中内容:', content);
    //   }
    // }
  };
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
    debugger
    if (e.buttons === 1) {
      // Primary (left) button
      e.detail === 2
        ? getCurrentWindow().toggleMaximize() // Maximize on double click
        : getCurrentWindow().startDragging(); // Else start dragging
    }
  }

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

    document.getElementById('clipboard-panel')?.addEventListener('mousedown', dragEvent);

    document.documentElement.style.background = 'none';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      focusedUnlisten.current?.();
      window.removeEventListener('keydown', handleKeyDown);
      document.getElementById('clipboard-panel')?.removeEventListener('mousedown', dragEvent);
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
      className=" bg-white  overflow-hidden flex flex-col  h-screen rounded-md"
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
        onAction={key => alert(key)}
      >
        {filteredClipboard.map((item, index) => (
          <ListboxItem
            id={item.id.toString()}
            data-index={index}
            onPress={async e => {
              console.log(e.target.getAttribute('data-index'));
              console.log(
                clipboard[
                  e.target.getAttribute('data-index') as unknown as number
                ].content
              );

              invoke('hide_panel');
              // await currentWindow?.hide();
              invoke('sendText', {
                name: clipboard[
                  e.target.getAttribute('data-index') as unknown as number
                ].content,
              });

              // writeText(clipboard[e.target.getAttribute('data-index') as unknown as number].content)
            }}
            key={item.id}
          >
            {item.content}
          </ListboxItem>
        ))}
      </Listbox>
    </div>
  );
};

export default Clipboard;
