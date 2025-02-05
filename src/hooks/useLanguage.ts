import { useAtom } from "jotai";
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { settingStore } from "../store";


export const useLanguage = () => {
    const { i18n } = useTranslation()
    const [setting] = useAtom(settingStore);

    useEffect(() => {
        i18n.changeLanguage(setting.language)
    }, [setting.language])
}