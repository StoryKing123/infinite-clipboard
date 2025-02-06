import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { clipboardStore, insertClipboard } from '../store';
import Database from '@tauri-apps/plugin-sql';
import { ClipboardEntry } from '../types';
import {
    onTextUpdate,
    startListening,
    onClipboardUpdate,
    onImageUpdate,
} from 'tauri-plugin-clipboard-api';
import { UnlistenFn } from '@tauri-apps/api/event';

export const useClipboard = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStore);
    const clipboardRef = useRef<ClipboardEntry[]>([]);
    const unlistenClipboard = useRef<() => Promise<void>>(undefined);
    const unlistenTextUpdate = useRef<UnlistenFn>(undefined);
    const unlistenImageUpdate = useRef<UnlistenFn>(undefined);
    const db = useRef<Database>(undefined);
    const [, insert] = useAtom(insertClipboard);

    const initDBInstance = async () => {
        const dbInstance = await Database.load('sqlite:app.db');
        db.current = dbInstance;
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
            console.log('text copy')
            if (
                clipboardRef.current.length > 1 &&
                clipboardRef.current[0].content === newText
            ) {
                return;
            }

            insert([{
                // id:'123',
                content: newText,
                type: 0,
                created_at: new Date().toISOString(),
            }])

            // const res = await db.current?.execute(
            //     'INSERT INTO clipboard (content, created_at,type) VALUES (?, ?,0)',
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
        });

        unlistenImageUpdate.current = await onImageUpdate(async newImage => {
            console.log('image copy')
            console.log(newImage)

            const res = await db.current?.execute(
                'INSERT INTO clipboard (content, created_at) VALUES (?, ?, 1)',
                [newImage, new Date().toISOString()]
            );
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

    useEffect(() => {
        if (db.current) {
            listenClipboard();
            initDB();
        }


        return () => {
            unlistenClipboard.current?.();
            unlistenTextUpdate.current?.();
            unlistenImageUpdate.current?.();
        };
    }, [db.current]);

    return {
        clipboard,
        clearHistory,
        insertClipbaord
    };
}; 