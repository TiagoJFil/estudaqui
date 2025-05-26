"use client"
import { useTranslation } from "react-i18next"


export function Footer() {
    const { t } = useTranslation()
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <p>&copy; {new Date().getFullYear() + " Examify " + t("footer.copyright")}</p>
                <p>Powered by AI</p>
            </div>
        </footer>
    )
}