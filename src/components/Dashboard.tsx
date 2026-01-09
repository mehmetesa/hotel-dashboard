import { useState, useEffect } from "react"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, formatDistanceToNow } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Users, LogOut, CheckCircle, BarChart3, Hotel, DoorOpen, Sun, Moon, Languages, History, User, Settings, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/lib/ThemeProvider"
import { useLanguage } from "@/lib/LanguageContext"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Room {
    id: number
    isOccupied: boolean
    guestCount: number
    guestNames: string[]
    checkoutDate: string | null
}

interface Activity {
    id: string
    type: 'check-in' | 'check-out' | 'update'
    roomId: number
    guestCount: number
    guestNames?: string[]
    timestamp: number
}

const TOTAL_ROOMS = 20
const RATE_PER_PERSON = 3000

export default function Dashboard() {
    const { setTheme } = useTheme()
    const { language, setLanguage, t } = useLanguage()

    const [rooms, setRooms] = useState<Room[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [guestCountInput, setGuestCountInput] = useState<number>(1)
    const [guestNamesInput, setGuestNamesInput] = useState<string[]>([])
    const [checkoutDateInput, setCheckoutDateInput] = useState<string>("")

    const [hotelName, setHotelName] = useState(() => localStorage.getItem("hotel-name") || "H-care")
    const [adminName, setAdminName] = useState(() => localStorage.getItem("admin-name") || "Emma Kwan")
    const [revenueMap, setRevenueMap] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem("hotel-revenue-map")
        return saved ? JSON.parse(saved) : {}
    })

    const locale = language === "tr" ? tr : enUS

    // Initialize data
    useEffect(() => {
        const savedRooms = localStorage.getItem("hotel-rooms")
        const savedActivities = localStorage.getItem("hotel-activities")

        if (savedRooms) {
            setRooms(JSON.parse(savedRooms))
        } else {
            const initialRooms = Array.from({ length: TOTAL_ROOMS }, (_, i) => ({
                id: i + 1,
                isOccupied: false,
                guestCount: 0,
                guestNames: [],
                checkoutDate: null,
            }))
            setRooms(initialRooms)
        }

        if (savedActivities) {
            setActivities(JSON.parse(savedActivities))
        }
    }, [])

    // Persist data
    useEffect(() => {
        if (rooms.length > 0) localStorage.setItem("hotel-rooms", JSON.stringify(rooms))
    }, [rooms])

    useEffect(() => {
        localStorage.setItem("hotel-activities", JSON.stringify(activities))
    }, [activities])

    useEffect(() => {
        localStorage.setItem("hotel-name", hotelName)
    }, [hotelName])

    useEffect(() => {
        localStorage.setItem("admin-name", adminName)
    }, [adminName])

    useEffect(() => {
        localStorage.setItem("hotel-revenue-map", JSON.stringify(revenueMap))
    }, [revenueMap])

    const handleRoomClick = (room: Room) => {
        setSelectedRoom(room)
        if (room.isOccupied) {
            setGuestCountInput(room.guestCount)
            setGuestNamesInput(room.guestNames)
            setCheckoutDateInput(room.checkoutDate || "")
        } else {
            setGuestCountInput(1)
            setGuestNamesInput([""])
            setCheckoutDateInput(format(addDays(new Date(), 1), "yyyy-MM-dd"))
        }
        setIsDialogOpen(true)
    }

    const addActivity = (type: Activity['type'], roomId: number, guestCount: number, guestNames?: string[]) => {
        const newActivity: Activity = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            roomId,
            guestCount,
            guestNames,
            timestamp: Date.now()
        }
        setActivities(prev => [newActivity, ...prev].slice(0, 20))
    }

    const handleSaveRoom = () => {
        if (!selectedRoom) return

        const type = selectedRoom.isOccupied ? 'update' : 'check-in'

        if (!selectedRoom.isOccupied) {
            const todayStr = format(new Date(), "yyyy-MM-dd")
            const earnedAmount = guestCountInput * RATE_PER_PERSON
            setRevenueMap(prev => ({
                ...prev,
                [todayStr]: (prev[todayStr] || 0) + earnedAmount
            }))
        }

        const updatedRooms = rooms.map((r) => {
            if (r.id === selectedRoom.id) {
                return {
                    ...r,
                    isOccupied: true,
                    guestCount: guestCountInput,
                    guestNames: guestNamesInput.slice(0, guestCountInput),
                    checkoutDate: checkoutDateInput,
                }
            }
            return r
        })

        setRooms(updatedRooms)
        addActivity(type, selectedRoom.id, guestCountInput, guestNamesInput.slice(0, guestCountInput))
        setIsDialogOpen(false)
    }

    const handleCheckout = () => {
        if (!selectedRoom) return

        const updatedRooms = rooms.map((r) => {
            if (r.id === selectedRoom.id) {
                return {
                    ...r,
                    isOccupied: false,
                    guestCount: 0,
                    guestNames: [],
                    checkoutDate: null,
                }
            }
            return r
        })

        setRooms(updatedRooms)
        addActivity('check-out', selectedRoom.id, selectedRoom.guestCount, selectedRoom.guestNames)
        setIsDialogOpen(false)
    }

    const handleGuestCountChange = (count: number) => {
        setGuestCountInput(count)
        const newNames = [...guestNamesInput]
        while (newNames.length < count) newNames.push("")
        setGuestNamesInput(newNames)
    }

    const calculateWeeklyRevenue = () => {
        const today = new Date()
        const start = startOfWeek(today, { weekStartsOn: 1 })
        const end = endOfWeek(today, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start, end })

        return days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd")
            return {
                name: format(day, "EEE", { locale }),
                total: revenueMap[dateStr] || 0,
            }
        })
    }

    const revenueData = calculateWeeklyRevenue()
    const totalOccupied = rooms.filter((r) => r.isOccupied).length
    const totalGuests = rooms.reduce((acc, r) => acc + r.guestCount, 0)

    const occupancyData = [
        { name: t("occupied"), value: totalOccupied, color: "oklch(0.67 0.16 245)" },
        { name: t("vacant"), value: TOTAL_ROOMS - totalOccupied, color: "oklch(0.96 0 0 / 0.1)" },
    ]

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b bg-card/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-300">
                            <Hotel className="text-primary-foreground w-7 h-7" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter leading-none">{hotelName}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-80">Management</span>
                        </div>
                    </div>

                    {rooms.some(r => r.isOccupied && r.checkoutDate && new Date(r.checkoutDate) < new Date(new Date().setHours(0, 0, 0, 0))) && (
                        <div className="hidden md:flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-xl border border-destructive/20 animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-bold">{t("overdueWarning") || "Gecikmiş Çıkış Var!"}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl hover:bg-muted"
                                onClick={() => setIsSettingsOpen(true)}
                            >
                                <Settings className="h-5 w-5" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
                                        <Languages className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setLanguage("tr")}>TR - Türkçe</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage("en")}>EN - English</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
                                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTheme("light")}>{t("themeLight")}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme("dark")}>{t("themeDark")}</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="h-8 w-px bg-border"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none">{adminName}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Hotel Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-muted p-2 border border-border flex items-center justify-center">
                                <User className="w-6 h-6 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: t("occupied"), value: `${totalOccupied}/${TOTAL_ROOMS}`, icon: DoorOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
                            { label: t("totalGuests"), value: totalGuests, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
                            { label: t("estimatedDaily"), value: `$${(revenueMap[format(new Date(), "yyyy-MM-dd")] || 0).toLocaleString()}`, icon: BarChart3, color: "text-orange-500", bg: "bg-orange-500/10" },
                            { label: t("vacant"), value: TOTAL_ROOMS - totalOccupied, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        ].map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-3 rounded-2xl", stat.bg)}>
                                            <stat.icon className={cn("w-6 h-6", stat.color)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                            <h3 className="text-2xl font-bold">{stat.value}</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <Card className="xl:col-span-2 border-none shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">{t("weeklyRevenue")}</CardTitle>
                                    <CardDescription>{t("revenueDesc")}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: 'var(--card)' }}
                                            formatter={(value: any) => [`$${value.toLocaleString()}`, t("revenueTooltip")]}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="oklch(0.67 0.16 245)" strokeWidth={4} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">{t("occupancyRate")}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={occupancyData} innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                                                {occupancyData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black">{Math.round((totalOccupied / TOTAL_ROOMS) * 100)}%</span>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 mt-4">
                                    {occupancyData.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span>{item.name}</span>
                                            </div>
                                            <span className="font-bold text-foreground">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        <Card className="xl:col-span-3 border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl">{t("roomManagement")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-8 gap-3">
                                    {rooms.map((room) => {
                                        const isOverdue = room.isOccupied && room.checkoutDate && new Date(room.checkoutDate) < new Date(new Date().setHours(0, 0, 0, 0))
                                        return (
                                            <button
                                                key={room.id}
                                                onClick={() => handleRoomClick(room)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-xl transition-all border relative overflow-hidden group",
                                                    room.isOccupied
                                                        ? isOverdue
                                                            ? "bg-destructive border-destructive text-white shadow-lg shadow-destructive/40"
                                                            : "bg-destructive/5 border-destructive/20"
                                                        : "bg-muted/50 border-border"
                                                )}
                                            >
                                                {isOverdue && <AlertTriangle className="absolute top-1 right-1 w-3 h-3 text-white" />}
                                                <span className={cn(
                                                    "text-xl font-black transition-transform group-hover:scale-110",
                                                    room.isOccupied ? isOverdue ? "text-white" : "text-destructive" : "text-foreground"
                                                )}>{room.id}</span>
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase opacity-50",
                                                    isOverdue ? "text-white/80" : ""
                                                )}>{room.isOccupied ? t("occupied") : t("vacant")}</span>
                                                {room.isOccupied && !isOverdue && (
                                                    <span className="text-[7px] font-bold mt-1 opacity-40">{format(new Date(room.checkoutDate!), "dd/MM")}</span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5 text-primary" /> {t("recentActivity")}</CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[400px] overflow-y-auto scrollbar-hide">
                                <div className="space-y-6">
                                    {activities.map((activity) => (
                                        <div key={activity.id} className="relative pl-6 border-l-2 border-muted pb-4">
                                            <div className={cn("absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-card", activity.type === 'check-in' ? "bg-primary" : "bg-destructive")} />
                                            <p className="text-xs font-medium text-foreground">
                                                {activity.guestNames?.filter(n => n.trim() !== "").join(", ") || `${activity.guestCount} ${t("guests")}`} {activity.roomId} {t(`activity${activity.type.charAt(0).toUpperCase() + activity.type.slice(1).replace('-', '')}`)}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">{formatDistanceToNow(activity.timestamp, { addSuffix: true, locale })}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{t("roomDetails")} {selectedRoom?.id}</DialogTitle>
                        <DialogDescription>{t("roomUpdateDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="guests" className="text-right font-bold">{t("guestLabel")}</Label>
                            <Input id="guests" type="number" value={guestCountInput} onChange={(e) => handleGuestCountChange(parseInt(e.target.value) || 0)} className="col-span-3 bg-muted border-none rounded-xl text-foreground" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-bold flex items-center gap-2"><User className="w-4 h-4" /> {t("guestNamesLabel")}</Label>
                            {Array.from({ length: guestCountInput }).map((_, i) => (
                                <Input key={i} placeholder={`${t("namePlaceholder")} ${i + 1}`} value={guestNamesInput[i] || ""} onChange={(e) => {
                                    const newNames = [...guestNamesInput]; newNames[i] = e.target.value; setGuestNamesInput(newNames);
                                }} className="bg-muted border-none rounded-xl text-foreground" />
                            ))}
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="checkout" className="text-right font-bold">{t("checkoutLabel")}</Label>
                            <Input id="checkout" type="date" value={checkoutDateInput} onChange={(e) => setCheckoutDateInput(e.target.value)} className="col-span-3 bg-muted border-none rounded-xl text-foreground" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-6 mt-4 border-t gap-4">
                        {selectedRoom?.isOccupied && <Button variant="ghost" onClick={handleCheckout} className="text-destructive rounded-xl"><LogOut className="mr-2 h-4 w-4" /> {t("checkOutBtn")}</Button>}
                        <Button onClick={handleSaveRoom} className="px-8 flex-1 rounded-xl h-11">{t("saveBtn")}</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{t("settingsTitle") || "Ayarlar"}</DialogTitle>
                        <DialogDescription>{t("settingsDesc") || "Hotel ve admin bilgilerini düzenle."}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>{t("hotelNameLabel") || "Otel Adı"}</Label>
                            <Input
                                value={hotelName}
                                onChange={(e) => setHotelName(e.target.value)}
                                className="bg-muted border-none rounded-xl text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t("adminNameLabel") || "Admin Adı"}</Label>
                            <Input
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                className="bg-muted border-none rounded-xl text-foreground"
                            />
                        </div>
                    </div>
                    <Button onClick={() => setIsSettingsOpen(false)} className="w-full rounded-xl">
                        {t("saveBtn")}
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
