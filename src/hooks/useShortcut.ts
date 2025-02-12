import { useEffect, useRef } from "react"
import { settingStore, shortcutStore } from "../store"
import { useAtom } from "jotai"
import { register, unregister } from "@tauri-apps/plugin-global-shortcut"

export const useShortcut = () => {
    const [shortcutList] = useAtom(shortcutStore)
    const [setting] = useAtom(settingStore)
    const previousShortcutList = useRef<SettingAtom['shortcut']>(undefined)
    useEffect(() => {
        const keys = Object.keys(shortcutList);

        if (previousShortcutList.current) {
            keys.forEach(key => {
                if (previousShortcutList.current![key as keyof SettingAtom['shortcut']]) {
                    unregister(previousShortcutList.current![key as keyof SettingAtom['shortcut']]!.key!)
                }
            })
        }
        keys.forEach(key => {
            const event = shortcutList![key as keyof SettingAtom['shortcut']]?.event!
            register(shortcutList![key as keyof SettingAtom['shortcut']]?.key!, event)
        })
        previousShortcutList.current = shortcutList

        console.log('short cut change register event,shortcut')
    }, [shortcutList])
    // useEffect(() => {
    //     console.log('short cut change register event,setting')
    // }, [setting])
}