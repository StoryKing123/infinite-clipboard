import { use, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { clipboardStore, connectionStore, insertClipboard, isProgrammaticClipboardStore, settingStore } from '../store';
import Database from '@tauri-apps/plugin-sql';
import { ClipboardEntry } from '../types';
import {
    onTextUpdate,
    startListening,
    onClipboardUpdate,
    onImageUpdate,
} from 'tauri-plugin-clipboard-api';
import { UnlistenFn } from '@tauri-apps/api/event';
import { getBase64ImageSize } from '../utils/image';
import request from '../request';

export const useClipboard = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStore);
    const clipboardRef = useRef<ClipboardEntry[]>([]);
    const unlistenClipboard = useRef<() => Promise<void>>(undefined);
    const unlistenTextUpdate = useRef<UnlistenFn>(undefined);
    const unlistenImageUpdate = useRef<UnlistenFn>(undefined);
    const db = useRef<Database>(undefined);
    const [isProgrammaticClipboard] = useAtom(isProgrammaticClipboardStore);
    const [, insert] = useAtom(insertClipboard);
    const [connection] = useAtom(connectionStore);
    const [setting] = useAtom(settingStore);
    const isProgrammaticClipboardRef = useRef<typeof isProgrammaticClipboard>(isProgrammaticClipboard);

    const settingRef = useRef<typeof setting>(setting);
    const connectionRef = useRef<typeof connection>(connection);

    useEffect(() => {
        isProgrammaticClipboardRef.current = isProgrammaticClipboard;
        // debugger
    }, [isProgrammaticClipboard])

    useEffect(() => {
        settingRef.current = setting;
    }, [setting])
    useEffect(() => {
        connectionRef.current = connection;
    }, [connection])

    const sendClipboardBroadcast = (type: number, data: string) => {
        const roomId = connectionRef.current?.room;
        const deviceId = settingRef.current.id;
        request.post(`events/broadcast/${roomId}/${deviceId}`, { message: { data: data, type: type } })
    }

    const initDBInstance = async () => {
        const dbInstance = await Database.load('sqlite:app.db');
        db.current = dbInstance;

        await db.current!.execute(`
            CREATE TABLE IF NOT EXISTS clipboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type INTEGER,
                content TEXT,
                created_at DATETIME
            );
             ALTER TABLE clipboard ADD COLUMN type INTEGER DEFAULT 0;
          `);
    };

    useEffect(() => {
        clipboardRef.current = clipboard;
    }, [clipboard]);

    const initDB = async () => {
        if (!db) return;

        await db.current!.execute(`
      CREATE TABLE IF NOT EXISTS clipboard (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type INTEGER,
          content TEXT,
          created_at DATETIME
      );
    --   ALTER TABLE clipboard ADD COLUMN type INTEGER DEFAULT 1;
    `);

        const res = (await db.current!.select('SELECT * FROM clipboard order by created_at desc')) as ClipboardEntry[];
        setClipboard(res);
    };

    const listenClipboard = async () => {

        console.log('register event')
        unlistenTextUpdate.current = await onTextUpdate(async newText => {
            if (isProgrammaticClipboardRef.current) return

            console.log('text copy')
            if (
                clipboardRef.current.length > 1 &&
                clipboardRef.current[0].content === newText
            ) {
                return;
            }

            insert([{
                content: newText,
                type: 0,
                created_at: new Date().toISOString(),
            }])
            sendClipboardBroadcast(0, newText)


            // if (res && res.lastInsertId) {
            //     setClipboard(prev => [
            //         {
            //             id: `${res.lastInsertId!}`,
            //             content: newText,
            //             type: 0,
            //             created_at: new Date().toISOString(),
            //         },
            //         ...prev,
            //     ]);
            // }
        });

        unlistenImageUpdate.current = await onImageUpdate(async newImage => {
            if (isProgrammaticClipboardRef.current) return
            console.log('image copy')
            // console.log(newImage)

            // for (let i = 0; i < clipboard.length && i < 10; i++) {
            // }

            const sizes = getBase64ImageSize(newImage)
            console.log(sizes)

            if (sizes.mb > 1) {
                console.log('image too large')
                return
            }

            insert([{ content: newImage, created_at: new Date().toISOString(), type: 1 }])
            sendClipboardBroadcast(1, newImage)
            // const res = await db.current?.execute(
            //     'INSERT INTO clipboard (content, created_at) VALUES (?, ?, 1)',
            //     [newImage, new Date().toISOString()]
            // );
        })

        unlistenClipboard.current = await startListening();
        onClipboardUpdate(() => {
            console.log('plugin:clipboard://clipboard-monitor/update event received');
        });
    };

    const clearHistory = async () => {
        if (!db) return;
        await db.current!.execute('DELETE FROM clipboard');
        setClipboard([]);
    };

    const insertClipbaord = async (newText: string) => {
        console.log('insert ')
        console.log(clipboardRef)
        if (
            clipboardRef.current.length > 1 &&
            clipboardRef.current[0].content === newText
        ) {
            return;
        }
        // insert([{
        //     id: '123',
        //     content: newText,
        //     type: 0,
        //     created_at: new Date().toISOString(),
        // }]);
        // insert

        // const res = await db.current?.execute(
        //     'INSERT INTO clipboard (content, created_at) VALUES (?, ?,0)',
        //     [newText, new Date().toISOString()]
        // );


        // if (res && res.lastInsertId) {
        //     setClipboard(prev => [
        //         {
        //             id: `${res.lastInsertId!}`,
        //             content: newText,
        //             type: 0,
        //             created_at: new Date().toISOString(),
        //         },
        //         ...prev,
        //     ]);
        // }
    }
    useEffect(() => {
        initDBInstance();
    }, [])

    // useEffect(() => {
    //     if (db.current) {
    //         listenClipboard();
    //         initDB();
    //     }


    //     return () => {
    
    //         unlistenClipboard.current?.();
    //         unlistenTextUpdate.current?.();
    //         unlistenImageUpdate.current?.();
    //     };
    // }, [db.current]);
    useEffect(() => {
        listenClipboard()
        return () => {
            unlistenClipboard.current?.();
            unlistenTextUpdate.current?.();
            unlistenImageUpdate.current?.();
        }
    }, [])

    return {
        clipboard,
        clearHistory,
        insertClipbaord
    };
}; 