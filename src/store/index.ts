import Database from "@tauri-apps/plugin-sql";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { nanoid } from "nanoid";

export const authStore = atomWithStorage<AuthAtom | undefined>(
  "auth",
  undefined
);
const dbInstance = await Database.load('sqlite:app.db');
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

    // 更新本地状态
    set(baseClipboardAtom, prev => [...fullEntries,...prev ]);
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

// 初始化加载
baseClipboardAtom.onMount = (setAtom) => {
  console.log('clipboard data on mount')
  Database.load('sqlite:app.db').then(db => {
    db.select<ClipboardEntry[]>("SELECT * FROM clipboard ORDER BY created_at DESC")
      .then(data => setAtom(data));
  });
};

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

export const settingStore = atomWithStorage<SettingAtom>("setting", {
  id: nanoid(10),
  theme: "light",
  language: 'zh-cn'
}, undefined, { getOnInit: true });
