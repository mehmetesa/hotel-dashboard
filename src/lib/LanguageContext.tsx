import React, { createContext, useContext, useState, useEffect } from "react"

type Language = "tr" | "en"

interface Translations {
    [key: string]: {
        [key: string]: string
    }
}

const translations: Translations = {
    tr: {
        title: "Otel Paneli",
        subtitle: "20 odalı otelinizi verimli bir şekilde yönetin.",
        occupied: "Dolu",
        totalGuests: "Toplam Misafir",
        rooms: "Odalar",
        revenue: "Gelir",
        roomManagement: "Oda Yönetimi",
        roomDesc: "Check-in/out yapmak veya detayları güncellemek için bir odaya tıklayın.",
        vacant: "Boş",
        guests: "MİSAFİR",
        weeklyRevenue: "Haftalık Gelir Projeksiyonu",
        revenueDesc: "Mevcut doluluğa göre tahmini (Kişi başı günlük 3.000$)",
        dailyRevenue: "Günlük Gelir",
        summary: "Gelir Özeti",
        performance: "Bir bakışta performans",
        estimatedDaily: "Tahmini Günlük",
        weeklyProjection: "Haftalık Projeksiyon",
        occupancyRate: "Doluluk Oranı",
        roomDetails: "Oda Detayları",
        roomUpdateDesc: "Doluluk detaylarını güncelleyin veya çıkış yapın.",
        guestLabel: "Misafir Sayısı",
        checkoutLabel: "Çıkış Tarihi",
        checkOutBtn: "Çıkış Yap",
        saveBtn: "Değişiklikleri Kaydet",
        langTr: "Türkçe",
        langEn: "İngilizce",
        themeLight: "Aydınlık",
        themeDark: "Karanlık",
        themeSystem: "Sistem",
        revenueTooltip: "Günlük Gelir",
        recentActivity: "Son Etkinlikler",
        noActivity: "Henüz etkinlik yok.",
        guestNamesLabel: "Misafir İsimleri",
        namePlaceholder: "Misafir adı",
        activityCheckIn: "nolu odaya rezervasyon yaptı",
        activityCheckOut: "nolu odadan çıkış yaptı",
        activityUpdate: "nolu oda bilgilerini güncelledi",
        timeJustNow: "Az önce",
        timeMinutesAgo: "dakika önce"
    },
    en: {
        title: "Hotel Dashboard",
        subtitle: "Manage your 20-room hotel efficiently.",
        occupied: "Occupied",
        totalGuests: "Total Guests",
        rooms: "Rooms",
        revenue: "Revenue",
        roomManagement: "Room Management",
        roomDesc: "Click on a room to check-in/out or update details.",
        vacant: "Vacant",
        guests: "GUESTS",
        weeklyRevenue: "Weekly Revenue Projection",
        revenueDesc: "Estimated based on current occupancy ($3,000 per person/day)",
        dailyRevenue: "Daily Revenue",
        summary: "Revenue Summary",
        performance: "Performance at a glance",
        estimatedDaily: "Estimated Daily",
        weeklyProjection: "Weekly Projection",
        occupancyRate: "Occupancy Rate",
        roomDetails: "Room Details",
        roomUpdateDesc: "Update occupancy details or check out.",
        guestLabel: "Guest Count",
        checkoutLabel: "Checkout Date",
        checkOutBtn: "Check Out",
        saveBtn: "Save Changes",
        langTr: "Turkish",
        langEn: "English",
        themeLight: "Light",
        themeDark: "Dark",
        themeSystem: "System",
        revenueTooltip: "Daily Revenue",
        recentActivity: "Recent Activity",
        noActivity: "No activity yet.",
        guestNamesLabel: "Guest Names",
        namePlaceholder: "Guest name",
        activityCheckIn: "made a reservation for room",
        activityCheckOut: "checked out from room",
        activityUpdate: "updated details for room",
        timeJustNow: "Just now",
        timeMinutesAgo: "mins ago"
    },
}

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem("language")
        return (saved as Language) || "tr"
    })

    useEffect(() => {
        localStorage.setItem("language", language)
    }, [language])

    const t = (key: string) => translations[language][key] || key

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider")
    return context
}
