import { Button, Kbd, Listbox, ListboxItem } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import hotkeys from 'hotkeys-js';
import { useAtom } from 'jotai';
import { settingStore } from '../../store';
import {
  register,
  ShortcutEvent,
  ShortcutHandler,
  unregister,
} from '@tauri-apps/plugin-global-shortcut';
import { invoke } from '@tauri-apps/api/core';
import { useImmer } from 'use-immer';

const Shortcut = () => {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(isRecording);
  const [setting, updateSetting] = useAtom(settingStore);
  const [shortcut, setShortcut] = useState<string>();
  const keysPressed = useRef(new Set<string>());
  const shortcutRef = useRef<string>(undefined);
  const previousShortcut = useRef<SettingAtom['shortcut']>(undefined);
  //   const currentAction = useRef<string>(undefined);
  const [currentAction, setCurrentAction] = useState<string>();
    useEffect(() => {
  //     console.log('update setting shortcut');
  //     previousShortcut.current = setting.shortcut;

      if (setting?.shortcut?.showOrHideClipboard?.key) {
        setShortcut(setting.shortcut.showOrHideClipboard.key);
        setShortcutList(draft => {
          const showOrHideClipboard = draft.find(
            item => item.action === 'showOrHideClipboard'
          );
          if (showOrHideClipboard) {
            showOrHideClipboard.key = setting.shortcut.showOrHideClipboard!.key!;
          }
        });
      }
      if (setting?.shortcut?.showOrHideSetting?.key) {
        setShortcutList(draft => {
          const showOrHideSettingItem = draft.find(
            item => item.action === 'showOrHideSetting'
          )!;
          showOrHideSettingItem.key = setting.shortcut.showOrHideSetting!.key!;
        });
      }
    }, [setting?.shortcut]);

  const [shortcutList, setShortcutList] = useImmer([
    {
      label: '显示或隐藏剪贴板',
      action: 'showOrHideClipboard',
      key: '',
    },
    {
      label: '显示或隐藏设置面板',
      action: 'showOrHideSetting',
      key: '',
    },
  ]);
  // 注册快捷键
  const registerHotkey = (hotkey: string) => {
    console.log('register key');
    console.log(hotkey);
    // hotkeys(hotkey, event => {
    //   event.preventDefault();
    //   // 这里执行你的功能，比如切换剪切板可见性
    //   console.log('触发剪切板显示/隐藏');
    // });
  };

  useEffect(() => {
    if (shortcut) registerHotkey(shortcut);
  }, [shortcut]);
  const startRecord = (action: string) => {
    setIsRecording(true);
  };
  const cancelRecord = () => {
    setIsRecording(false);
  };
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isRecordingRef.current) return;

      e.preventDefault();
      //   return;

      const key = e.key.toLowerCase();

      // 转换按键符号
      let hotkeyKey: string;
      switch (key) {
        case 'meta':
          hotkeyKey = 'command';
          break;
        case 'control':
          hotkeyKey = 'ctrl';
          break;
        case 'shift':
        case 'alt':
          hotkeyKey = key;
          break;
        default:
          if (e.key.length === 1) hotkeyKey = key;
          else return;
      }

      // 添加按键到集合
      keysPressed.current.add(hotkeyKey);
      updateDisplay();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isRecordingRef.current) return;
      //   return;

      // 处理确认和取消
      if (e.key === 'Enter') {
        confirmShortcut();
        return;
      }
      if (e.key === 'Escape') {
        cancelRecord();
        return;
      }

      // 移除释放的按键
      const key = convertKey(e.key);
      keysPressed.current.delete(key);

      if (keysPressed.current.size === 0) {
        // cancelRecord();
        confirmShortcut();
      }
    };

    const convertKey = (key: string) => {
      switch (key.toLowerCase()) {
        case 'meta':
          return 'command';
        case 'control':
          return 'ctrl';
        default:
          return key.toLowerCase();
      }
    };

    const updateDisplay = () => {
      console.log('update');
      console.log(keysPressed.current);
      const keys = Array.from(keysPressed.current)
        // .sort((a, b) => a.localeCompare(b)) // 排序保证顺序一致
        .join('+');
      console.log(keys);
      setShortcut(keys);
      shortcutRef.current = keys;
    };

    const confirmShortcut = async () => {
      setIsRecording(false);
      if (!shortcutRef.current) return;
      console.log(shortcutRef.current);
      // 需要至少一个普通键
      if (
        shortcutRef.current
          .split('+')
          .some(k => !['command', 'ctrl', 'shift', 'alt'].includes(k))
      ) {
        if (currentAction) {
          updateSetting(setting => ({
            ...setting,
            shortcut: {
              ...setting.shortcut,
              [currentAction]: {key:shortcutRef.current},
            },
          }));
          console.log({
            ...setting,
            shortcut: {
              ...setting.shortcut,
              [currentAction]: {key:shortcutRef.current},
            },
          })
        //   debugger

          //       if (
          //         previousShortcut.current?.[
          //           currentAction as keyof SettingAtom['shortcut']
          //         ]?.key
          //       ) {
          //         console.log(
          //           'unregister :',
          //           previousShortcut.current.showOrHideClipboard
          //         );
          //         try {
          //           await unregister(
          //             previousShortcut.current?.[
          //               currentAction as keyof SettingAtom['shortcut']
          //             ]!.key!
          //           );
          //         } catch (err) {
          //           console.error(err);
          //         }
          //       }

                // const bindEvent = shortcutList.find(
                //   item => item.action === currentAction
                // )?.event;

                // if (bindEvent) {
                //   await register(shortcutRef.current, bindEvent);
                // }
        }

        //     // console.log('unbind and bind');
        //     // if (previousShortcut.current?.showOrHideClipboard) {
        //     //   console.log(
        //     //     'unregister :',
        //     //     previousShortcut.current.showOrHideClipboard
        //     //   );
        //     //   try {
        //     //     await unregister(previousShortcut.current.showOrHideClipboard);
        //     //   } catch (err) {
        //     //     console.error(err);
        //     //   }
        //     // }
        //     // updateSetting({
        //     //   ...setting,
        //     //   shortcut: {
        //     //     ...setting.shortcut,
        //     //     showOrHideClipboard: shortcutRef.current,
        //     //   },
        //     // });
        //     // console.log('register');
        //     // unregister(shortcutRef.current);
        //     // await register(shortcutRef.current, async event => {
        //     //   console.log('show or hide');
        //     //   if (event.state === 'Pressed') {
        //     //     invoke('show_panel');
        //     //   }
        //     // });
      }

      setIsRecording(false);
      keysPressed.current.clear();
    };

    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording]);
  //   useEffect(() => {
  //     const escapeEvent = (e: KeyboardEvent) => {
  //       console.log(e);
  //       if (e.code === 'Escape') {
  //         if (isRecordingRef.current === true) {
  //           cancelRecord();
  //         }
  //       }
  //     };
  //     window.document.addEventListener('keydown', escapeEvent);
  //     return () => {
  //       window.document.removeEventListener('keydown', escapeEvent);
  //     };
  //   }, []);

  const handleBindingAction = (action: string) => {
    // startRecord(shortcut.action)
    if (!setIsRecording) return;
    setIsRecording(true);
    setCurrentAction(action);
    // currentAction.current = koction;
  };
  const renderCurrentKbd = (shortcut: (typeof shortcutList)[number]) => {
    if (isRecording && currentAction === shortcut.action)
      return <span>录制中</span>;
    else if (isRecording && currentAction !== shortcut.action) {
      return <span>{shortcut.key}</span>;
    } else if (!isRecording) {
      return <span>{shortcut.key}</span>;
    }
    return <></>;
  };
  console.log(shortcutRef.current);
  console.log(shortcutList);
  return (
    <div>
      快捷键
      <Listbox
        classNames={{
          //   base: 'max-w-xs',
          list: 'max-h-[300px] overflow-scroll',
        }}
        selectionMode="multiple"
        // topContent={topContent}
        variant="flat"
        // onSelectionChange={setValues}
      >
        {/* <ListboxItem
          showDivider
          isReadOnly
          startContent={<div>显示/隐藏剪切板</div>}
          endContent={
            <div>
              <Kbd onClick={startRecord} keys={['command']}>
                {isRecording && keysPressed.current.size === 0 && '录制中'}
                {isRecording && keysPressed.current.size > 0 && shortcut}
                {!isRecording && shortcut}
                {!isRecording && !shortcut && '设置快捷键'}
              </Kbd>
            </div>
          }
        ></ListboxItem> */}
        {shortcutList.map(shortcut => (
          <ListboxItem
            showDivider
            isReadOnly
            key={shortcut.action}
            startContent={<div>{shortcut.label}</div>}
            endContent={
              <Kbd onClick={() => handleBindingAction(shortcut.action)}>
                {renderCurrentKbd(shortcut)}
                {/* {isRecording &&
                  currentAction === shortcut.action &&
                  shortcut.key}
                  {!isRecording && shortcut.key} */}
              </Kbd>
            }
          ></ListboxItem>
        ))}
      </Listbox>
      {/* <Button>保存</Button> */}
    </div>
  );
};
export default Shortcut;
