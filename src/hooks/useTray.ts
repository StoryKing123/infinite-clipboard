import { useEffect } from "react"
import { TrayIcon } from '@tauri-apps/api/tray';
import { Menu } from '@tauri-apps/api/menu';
import trayImg from '../../src-tauri/icons/tray.ico'
import { useTranslation } from "react-i18next";
import { Window } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export const useTray = () => {

    const { t } = useTranslation()
    const initTray = async () => {
        const menu = await Menu.new({
            items: [
                {
                    id: 'setting',
                    text: t('tray.setting.label'),
                    action: async () => {
                        let mainWindow = await Window.getByLabel('main')
                        if (mainWindow) {
                            await mainWindow.show();
                            await mainWindow.setFocus()
                        }
                    }
                },
                {
                    id: 'quit',
                    text: t('tray.quit.label'),
                    action: () => {
                        invoke('exit_app')

                    }
                },

            ],
        });
        const img = new Image()
        img.src = trayImg
        const options = {
            menu,
            menuOnLeftClick: true,
            icon: img
            // icon: await defaultWindowIcon(),
        };

        const tray = await TrayIcon.getById('main')
        tray?.setMenu(menu)
        // tray?.
    }
    useEffect(() => {
        initTray();

    }, [])
}