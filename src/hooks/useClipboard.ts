import { useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { clipboardStore } from '../store';
import Database from '@tauri-apps/plugin-sql';
import { ClipboardEntry } from '../types';
import {
    onTextUpdate,
    startListening,
    onClipboardUpdate,
} from 'tauri-plugin-clipboard-api';
import { UnlistenFn } from '@tauri-apps/api/event';

export const useClipboard = () => {
    const [clipboard, setClipboard] = useAtom(clipboardStore);
    const clipboardRef = useRef<ClipboardEntry[]>([]);
    const unlistenClipboard = useRef<() => Promise<void>>(undefined);
    const unlistenTextUpdate = useRef<UnlistenFn>(undefined);
    const db = useRef<Database>(undefined);

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
          content TEXT,
          created_at DATETIME
      )
    `);

        const res = (await db.current!.select('SELECT * FROM clipboard order by created_at desc')) as ClipboardEntry[];
        setClipboard(res);
    };

    const listenClipboard = async () => {

        console.log('register event')
        unlistenTextUpdate.current = await onTextUpdate(async newText => {
            if (
                clipboardRef.current.length > 1 &&
                clipboardRef.current[0].content === newText
            ) {
                return;
            }

            const res = await db.current?.execute(
                'INSERT INTO clipboard (content, created_at) VALUES (?, ?)',
                [newText, new Date().toISOString()]
            );

            if (res && res.lastInsertId) {
                setClipboard(prev => [
                    {
                        id: res.lastInsertId!,
                        content: newText,
                        created_at: new Date().toISOString(),
                    },
                    ...prev,
                ]);
            }
        });

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

        const res = await db.current?.execute(
            'INSERT INTO clipboard (content, created_at) VALUES (?, ?)',
            [newText, new Date().toISOString()]
        );


        if (res && res.lastInsertId) {
            setClipboard(prev => [
                {
                    id: res.lastInsertId!,
                    content: newText,
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
        }
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
        };
    }, [db.current]);

    return {
        clipboard,
        clearHistory,
        insertClipbaord
    };
}; 