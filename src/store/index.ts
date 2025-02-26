import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { ShortcutEvent } from "@tauri-apps/plugin-global-shortcut";
import Database from "@tauri-apps/plugin-sql";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { nanoid } from "nanoid";

export const authStore = atomWithStorage<AuthAtom | undefined>(
  "auth",
  undefined
);
// const dbInstance = await Database.load('sqlite:app.db');
export const baseClipboardAtom = atom<ClipboardEntry[]>([]);

export const insertClipboard = atom(null,
  async (get, set, entries: Omit<ClipboardEntry, "id" | "timestamp">[]) => {
    console.log('insert clipboard')
    const db = await Database.load('sqlite:app.db');
    const timestamp = Date.now();

    // 生成完整条目
    const fullEntries = entries.map(entry => ({
      ...entry,
      id: nanoid(),
      timestamp
    }));

    // 批量插入数据库
    const placeholders = fullEntries.map(() => '( ?, ?, ?)').join(',');
    const values = fullEntries.flatMap(entry => [
      entry.content,
      entry.created_at,
      entry.type
    ]);

    await db.execute(
      `INSERT INTO clipboard ( content, created_at, type) VALUES ${placeholders}`,
      values
    );

    await emit('clipboard-db-changed', {});
    // 更新本地状态
    // set(baseClipboardAtom, prev => [...fullEntries, ...prev]);
  })

export const deleteClipboard = atom(null, async (get, set, ids: string[]) => {
  const db = await Database.load('sqlite:app.db');
  if (ids.length === 0) {
    await db.execute(`DELETE FROM clipboard WHERE id `);
  } else {
    await db.execute(`DELETE FROM clipboard WHERE id IN (${ids.join(',')})`);
  }
  await emit('clipboard-db-changed', {});
})

// 组合原子
export const clipboardStore = atom(
  (get) => get(baseClipboardAtom),
  (get, set, action: ClipboardEntry[] | ((prev: ClipboardEntry[]) => ClipboardEntry[])) => {
    // 保留原始set逻辑用于其他操作
    const nextValue = typeof action === 'function' ? action(get(baseClipboardAtom)) : action;
    set(baseClipboardAtom, nextValue);
  }
);

// 监听数据库更新事件
const setupClipboardSync = () => {
  let unlisten: () => void;

  const init = async (setAtom: (data: ClipboardEntry[]) => void) => {
    console.log('listen event')
    // debugger
    // 初始化加载数据
    const loadData = async () => {
      const db = await Database.load('sqlite:app.db');
      return db.select<ClipboardEntry[]>(
        "SELECT * FROM clipboard ORDER BY created_at DESC"
      );
    };

    // 首次加载
    setAtom(await loadData());
    console.log('listen event2')

    // 监听更新事件
    unlisten = await listen('clipboard-db-changed', async () => {
      setAtom(await loadData());
    });
  };

  return {
    onMount: (setAtom: (data: ClipboardEntry[]) => void) => {
      init(setAtom);
      return () => unlisten?.();
    }
  };
};
// 初始化加载
baseClipboardAtom.onMount = setupClipboardSync().onMount;

// const storage: SyncStorage<ClipboardEntry[]> = {
//   getItem: function (key: string, initialValue: ClipboardEntry[]): ClipboardEntry[] {
//     console.log('getItem', key);
//     // throw new Error("Function not implemented.");
//     const res = dbInstance.select(
//       "SELECT * from clipboard",
//     );
//     console.log(res)
//     res.then(res=>{console.log(res)})
//     return res as unknown as ClipboardEntry[];
//   },
//   setItem: function (key: string, newValue: ClipboardEntry[]): void {
//     throw new Error("Function not implemented.");
//   },
//   removeItem: function (key: string): void {
//     throw new Error("Function not implemented.");
//   }
// }
// export const clipboardStore = atomWithStorage<ClipboardEntry[]>("clipboard", [], storage);

export const connectionStore = atom<ConnectionAtom>();
// export const 

export const settingStore = atomWithStorage<SettingAtom>("setting",{
  id: nanoid(10),
  theme: "light",
  language: 'zh-cn',
  shortcut: { showOrHideClipboard: { key: undefined }, showOrHideSetting: { key: undefined } }
}, undefined, { getOnInit: true });

export const shortcutStore = atom(get => {
  const shortcut = get(settingStore).shortcut;
  if (shortcut.showOrHideClipboard) {
    shortcut.showOrHideClipboard.event = (event: ShortcutEvent) => {
      // console.log('show or hide clipboard')
      if (event.state === 'Pressed') {
        invoke('show_panel');
      }
    }
  }
  if (shortcut.showOrHideSetting) {
    shortcut.showOrHideSetting.event = (event: ShortcutEvent) => {
      if (event.state === 'Pressed') {
        // invoke('show_panel');
        console.log('show or hide setting')

      }
    }
  }
  return shortcut
})


export const isProgrammaticClipboardStore = atomWithStorage('isProgrammaticClipabord', false)