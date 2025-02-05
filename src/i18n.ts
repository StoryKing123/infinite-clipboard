import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from "./locales/resources";



// const resourcelocal = {
//     en: { title: "Willkommen zu react und react-i18next", description: { part1: "Um loszulegen, ändere <1>src/App(DE).js</1> speicheren und neuladen.", part2: "Ändere die Sprachen zwischen deutsch und englisch mit Hilfe der beiden Schalter." } },
//     zh: { title: "Willkommen zu react und react-i18next", description: { part1: "Um loszulegen, ändere <1>src/App(DE).js</1> speicheren und neuladen.", part2: "Ändere die Sprachen zwischen deutsch und englisch mit Hilfe der beiden Schalter." } }
// }

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
// const resources = {
// en: {
// },
// "zh": {
//     translation: {
//         "setting": {
//             "language": { "label": "语言" }
//         }
//     }
// }
// };

console.log(resources)

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .use(LanguageDetector)
    .init({
        supportedLngs: ['zh', 'en'],
        resources: resources,
        // lng:'zh',
        lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
        // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
        // if you're using a language detector, do not define the lng option

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;