"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Banknote,
  X,
  Edit3,
  Trash2,
  LogOut,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  BarChart3,
  Home,
  ChevronDown,
  Menu,
  Camera,
  PieChart,
  Shield,
  List,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Transaction {
  id: number;
  type: string;
  amount: string;
  category: string;
  paymentMethod: string;
  description: string;
  date: string;
  time: string;
  createdAt: string;
}

type PageType =
  | "home"
  | "income"
  | "expense"
  | "cash"
  | "card"
  | "all"
  | "analysis"
  | "currency"
  | "currency-add"
  | "currency-history";

const categories = [
  "Maaş",
  "Freelance",
  "Yatırım",
  "Kira",
  "Market",
  "Fatura",
  "Yemek",
  "Ulaşım",
  "Eğlence",
  "Sağlık",
  "Eğitim",
  "Giyim",
  "Teknoloji",
  "Ev Eşyası",
  "Diğer",
];

const GOLD_TYPES = [
  { key: "XAU", name: "Gram Altın", icon: "🥇", grams: 1 },
  { key: "CEYREK", name: "Çeyrek Altın", icon: "🪙", grams: 1.75 },
  { key: "YARIM", name: "Yarım Altın", icon: "🪙", grams: 3.5 },
  { key: "TAM", name: "Tam Altın", icon: "🪙", grams: 7.0 },
  { key: "CUMHURIYET", name: "Cumhuriyet Altını", icon: "🏛️", grams: 7.2 },
  { key: "ATA", name: "Ata Altın", icon: "⭐", grams: 7.2 },
  { key: "BESLI", name: "5'li Bilezik", icon: "💍", grams: 17.5 },
];

const isGold = (curr: string) => GOLD_TYPES.some((g) => g.key === curr);

const getGoldInfo = (key: string) => GOLD_TYPES.find((g) => g.key === key) || null;

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const getCategoryIcon = (cat: string) => {
  const map: Record<string, string> = {
    Maaş: "💰",
    Freelance: "💻",
    Yatırım: "📈",
    Kira: "🏠",
    Market: "🛒",
    Fatura: "📄",
    Yemek: "🍽️",
    Ulaşım: "🚗",
    Eğlence: "🎮",
    Sağlık: "💊",
    Eğitim: "📚",
    Giyim: "👕",
    Teknoloji: "📱",
    "Ev Eşyası": "🏡",
    Diğer: "📌",
  };
  return map[cat] || "📌";
};

const formatCurrency = (val: string) => {
  const num = parseFloat(val);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(num);
};

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [balance, setBalance] = useState({ total: "0", cash: "0", card: "0" });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmailState, setUserEmailState] = useState("");
  const [profileDropdown, setProfileDropdown] = useState(false);

  // Add form
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Maaş");
  const [txPaymentMethod, setTxPaymentMethod] = useState<"cash" | "card">("cash");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txTime, setTxTime] = useState("");

  // Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  // Analysis
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Currency states
  const [currencyTxns, setCurrencyTxns] = useState<
    { id: number; currency: string; amount: string; buyPrice: string; totalPrice: string; source: string; date: string; time: string }[]
  >([]);
  const [currencyRates, setCurrencyRates] = useState<Record<string, { tryBuy: number; trySell: number; name: string; change: number }>>({});
  const [currencyLoading, setCurrencyLoading] = useState(true);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [prevRates, setPrevRates] = useState<Record<string, number>>({});

  // Currency form
  const [curCurrency, setCurCurrency] = useState("USD");
  const [curAmount, setCurAmount] = useState("");
  const [curDate, setCurDate] = useState(new Date().toISOString().split("T")[0]);
  const [curTime, setCurTime] = useState(new Date().toTimeString().slice(0, 5));

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail") || "";
    if (!id) {
      router.push("/");
      return;
    }
    setUserId(Number(id));
    setUserEmailState(email);
    const photo = localStorage.getItem("profilePhoto");
    if (photo) setProfilePhoto(photo);
  }, [router]);

  const loadData = async () => {
    if (!userId) return;
    const balRes = await fetch(`/api/balance?userId=${userId}`);
    const balData = await balRes.json();
    if (balData.balance) setBalance(balData.balance);

    const txRes = await fetch(`/api/transactions?userId=${userId}`);
    const txData = await txRes.json();
    if (txData.transactions) setTransactions(txData.transactions);
    setLoading(false);
  };

  const loadCurrencyData = async () => {
    if (!userId) return;
    setCurrencyLoading(true);
    setRatesLoading(true);

    // Load rates
    try {
      const ratesRes = await fetch("/api/currency/rates");
      const ratesData = await ratesRes.json();
      if (ratesData.rates) {
        // Calculate change from previous
        const newRates: Record<string, { tryBuy: number; trySell: number; name: string; change: number }> = {};
        for (const [key, val] of Object.entries(ratesData.rates) as [string, any][]) {
          const prev = prevRates[key] || val.tryBuy;
          const change = val.tryBuy - prev;
          newRates[key] = { ...val, change };
        }
        setCurrencyRates(newRates);
        setPrevRates((prev) => {
          const updated = { ...prev };
          for (const [key, val] of Object.entries(newRates)) {
            updated[key] = val.tryBuy;
          }
          return updated;
        });
      }
    } catch {
      // use cached rates if available
    } finally {
      setRatesLoading(false);
    }

    // Load currency transactions
    const curRes = await fetch(`/api/currency?userId=${userId}`);
    const curData = await curRes.json();
    if (curData.transactions) setCurrencyTxns(curData.transactions);
    setCurrencyLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    loadCurrencyData();
    // Refresh rates every 60 seconds
    const interval = setInterval(loadCurrencyData, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const resetForm = () => {
    const now = new Date();
    setTxAmount("");
    setTxCategory("Maaş");
    setTxPaymentMethod("cash");
    setTxDescription("");
    setTxDate(now.toISOString().split("T")[0]);
    setTxTime(now.toTimeString().slice(0, 5));
  };

  const resetCurrencyForm = () => {
    const now = new Date();
    setCurAmount("");
    setCurCurrency("USD");
    setCurDate(now.toISOString().split("T")[0]);
    setCurTime(now.toTimeString().slice(0, 5));
  };

  const handleAddCurrency = async () => {
    if (!userId || !curAmount) return;
    const rate = currencyRates[curCurrency]?.tryBuy || 0;
    if (rate === 0) return;

    const amount = parseFloat(curAmount);
    const totalPrice = (amount * rate).toFixed(2);

    await fetch("/api/currency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        currency: curCurrency,
        amount: curAmount,
        buyPrice: rate.toFixed(4),
        totalPrice,
        source: `${curCurrency} alım - canlı kur`,
        type: "buy",
        date: curDate,
        time: curTime,
      }),
    });

    resetCurrencyForm();
    loadCurrencyData();
    setCurrentPage("currency");
  };

  const handleDeleteCurrency = async (id: number) => {
    await fetch("/api/currency", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    });
    loadCurrencyData();
  };

  const handleAddTransaction = async () => {
    if (!userId || !txAmount) return;
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, type: txType, amount: txAmount, category: txCategory,
        paymentMethod: txPaymentMethod, description: txDescription,
        date: txDate, time: txTime,
      }),
    });
    resetForm();
    loadData();
    setCurrentPage("home");
  };

  const handleEditTransaction = async () => {
    if (!editTx) return;
    await fetch("/api/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editTx.id, type: editTx.type, amount: editTx.amount,
        category: editTx.category, paymentMethod: editTx.paymentMethod,
        description: editTx.description, date: editTx.date, time: editTx.time,
      }),
    });
    setShowEditModal(false);
    setEditTx(null);
    loadData();
  };

  const handleDeleteTransaction = async (id: number) => {
    await fetch("/api/transactions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    });
    loadData();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePhoto(result);
        localStorage.setItem("profilePhoto", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const filteredTransactions = (filter: "cash" | "card" | "all") => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.paymentMethod === filter);
  };

  const getMonthlyAnalysis = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const monthTxs = transactions.filter((t) => {
      const txDate = t.date;
      return txDate.startsWith(`${year}-${month}`);
    });

    const totalIncome = monthTxs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = monthTxs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const byCategory: Record<string, { income: number; expense: number }> = {};
    monthTxs.forEach((t) => {
      if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 };
      if (t.type === "income") byCategory[t.category].income += parseFloat(t.amount);
      else byCategory[t.category].expense += parseFloat(t.amount);
    });

    const byPayment: Record<string, number> = { cash: 0, card: 0 };
    monthTxs.forEach((t) => {
      byPayment[t.paymentMethod] += parseFloat(t.amount);
    });

    return { totalIncome, totalExpense, byCategory, byPayment, count: monthTxs.length };
  };

  const userEmail = userEmailState;
  const monthTxs = getMonthlyAnalysis(selectedMonth);

  if (!userId) return null;

  // Sidebar content
  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Profile Section */}
      <div className="p-6 border-b border-white/5">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-slate-800 border-2 border-white/20 rounded-full flex items-center justify-center cursor-pointer group-hover:bg-slate-700 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <input id="sidebar-photo-input" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <p className="text-white font-medium mt-3 text-sm">{userEmail}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavButton
          icon={<Home className="w-5 h-5" />}
          label="Ana Sayfa"
          active={currentPage === "home"}
          onClick={() => navigateTo("home")}
        />
        <NavButton
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          label="Gelir Ekle"
          active={currentPage === "income"}
          onClick={() => {
            setTxType("income");
            resetForm();
            navigateTo("income");
          }}
        />
        <NavButton
          icon={<TrendingDown className="w-5 h-5 text-red-400" />}
          label="Gider Ekle"
          active={currentPage === "expense"}
          onClick={() => {
            setTxType("expense");
            resetForm();
            navigateTo("expense");
          }}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-3">İşlemler</p>
        </div>
        <NavButton
          icon={<List className="w-5 h-5" />}
          label="Tüm İşlemler"
          active={currentPage === "all"}
          onClick={() => navigateTo("all")}
          badge={transactions.length}
        />
        <NavButton
          icon={<Banknote className="w-5 h-5 text-emerald-400" />}
          label="Nakit İşlemler"
          active={currentPage === "cash"}
          onClick={() => navigateTo("cash")}
          badge={transactions.filter((t) => t.paymentMethod === "cash").length}
        />
        <NavButton
          icon={<CreditCard className="w-5 h-5 text-blue-400" />}
          label="Kart İşlemler"
          active={currentPage === "card"}
          onClick={() => navigateTo("card")}
          badge={transactions.filter((t) => t.paymentMethod === "card").length}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-3">Analiz</p>
        </div>
        <NavButton
          icon={<PieChart className="w-5 h-5 text-violet-400" />}
          label="Aylık Analiz"
          active={currentPage === "analysis"}
          onClick={() => navigateTo("analysis")}
        />

        <div className="pt-4 pb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider px-3">Döviz</p>
        </div>
        <NavButton
          icon={<DollarSign className="w-5 h-5 text-amber-400" />}
          label="Döviz Portföyü"
          active={currentPage === "currency"}
          onClick={() => navigateTo("currency")}
        />
        <NavButton
          icon={<Plus className="w-5 h-5 text-emerald-400" />}
          label="Döviz Ekle"
          active={currentPage === "currency-add"}
          onClick={() => {
            resetCurrencyForm();
            navigateTo("currency-add");
          }}
        />
        <NavButton
          icon={<List className="w-5 h-5 text-blue-400" />}
          label="Döviz Geçmişi"
          active={currentPage === "currency-history"}
          onClick={() => navigateTo("currency-history")}
        />
      </nav>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex lg:flex-col lg:w-72 bg-slate-900 border-r border-white/5 h-screen sticky top-0"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
      >
        {SidebarContent}
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed left-0 top-0 z-50 w-72 h-full bg-slate-900 border-r border-white/5 lg:hidden"
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Finans Takip</h1>
                <p className="text-xs text-slate-400">Kişisel Panel</p>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center overflow-hidden ring-2 ring-white/10 hover:ring-white/30 transition-all"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {profileDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-14 z-50 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overfl
