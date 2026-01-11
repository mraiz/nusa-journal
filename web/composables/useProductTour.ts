import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import '~/assets/css/product-tour.css'

export const useProductTour = () => {
  const route = useRoute()
  const router = useRouter()
  const companyStore = useCompanyStore()

  // State
  const isActive = ref(false)

  // Keys for persistence
  const TOUR_STATE_KEY = 'nj_tour_state'
  const TOUR_COMPLETED_KEY = 'nj_tour_completed'

  // --- Steps Definition ---
  const getSteps = (companySlug: string): DriveStep[] => [
    {
      element: '#tour-welcome',
      popover: {
        title: 'Selamat Datang di Nusa Journal! 👋',
        description:
          'Mari kita tur singkat untuk membantu Anda mengelola akuntansi dengan efektif.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#menu-accounts',
      popover: {
        title: 'Bagan Akun (Chart of Accounts)',
        description:
          'Struktur akuntansi Anda dimulai di sini. Definisikan Aset, Kewajiban, Pendapatan, dan Beban.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '#menu-settings',
      popover: {
        title: 'Pengaturan Perusahaan',
        description:
          'Konfigurasi preferensi perusahaan dan default akuntansi di sini untuk pencatatan jurnal secara otomatis.',
        side: 'right',
      },
    },
    {
      element: '#menu-journals',
      popover: {
        title: 'Jurnal Umum',
        description: 'Catat transaksi keuangan secara manual dengan jurnal umum.',
        side: 'right',
      },
    },
    {
      element: '#menu-ledger',
      popover: {
        title: 'Buku Besar (Ledger)',
        description: 'Lihat rincian transaksi per akun dan saldo berjalan.',
        side: 'right',
      },
    },
    {
      element: '#menu-contacts',
      popover: {
        title: 'Kontak',
        description: 'Kelola data pelanggan dan vendor Anda di sini.',
        side: 'right',
      },
    },
    {
      element: '#menu-products',
      popover: {
        title: 'Produk & Layanan',
        description: 'Daftar produk atau jasa yang Anda jual.',
        side: 'right',
      },
    },
    {
      element: '#menu-sales',
      popover: {
        title: 'Penjualan',
        description: 'Buat invoice penjualan dan lacak piutang pelanggan.',
        side: 'right',
      },
    },
    {
      element: '#menu-purchase',
      popover: {
        title: 'Pembelian',
        description: 'Catat bill pembelian dan hutang ke vendor.',
        side: 'right',
      },
    },
    {
      element: '#menu-payments',
      popover: {
        title: 'Pembayaran',
        description: 'Rekam pembayaran masuk dan keluar.',
        side: 'right',
      },
    },
    {
      element: '#menu-reports',
      popover: {
        title: 'Laporan Keuangan',
        description: 'Lihat Neraca, Laba Rugi, dan Arus Kas secara real-time.',
        side: 'right',
      },
    },
  ]

  // --- Driver Instance ---
  let driverObj: any = null

  const initDriver = () => {
    const slug = companyStore.currentCompany?.slug || (route.params.companySlug as string)
    if (!slug) return

    const steps = getSteps(slug)

    driverObj = driver({
      showProgress: true,
      steps: steps,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayClickNext: false,
      stagePadding: 12,
      stageRadius: 12,
      popoverOffset: 15,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      stageBackground: '#ffffff',
      onNextClick: () => {
        // Get the next step's element and pre-scroll before moving
        const currentIndex = driverObj.getActiveIndex()
        const nextStep = steps[currentIndex + 1]

        if (nextStep?.element) {
          const el = document.querySelector(nextStep.element as string) as HTMLElement
          const sidebarNav = document.querySelector('#sidebar-nav') as HTMLElement

          if (el && sidebarNav) {
            // Calculate and scroll to center the element in sidebar
            const navRect = sidebarNav.getBoundingClientRect()
            const elRect = el.getBoundingClientRect()
            const targetScrollTop =
              sidebarNav.scrollTop +
              (elRect.top - navRect.top) -
              navRect.height / 2 +
              elRect.height / 2
            sidebarNav.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
          }
        }

        // Wait for scroll to complete then move to next
        setTimeout(() => {
          driverObj.moveNext()
        }, 300)
      },
      onPrevClick: () => {
        // Similar for previous
        const currentIndex = driverObj.getActiveIndex()
        const prevStep = steps[currentIndex - 1]

        if (prevStep?.element) {
          const el = document.querySelector(prevStep.element as string) as HTMLElement
          const sidebarNav = document.querySelector('#sidebar-nav') as HTMLElement

          if (el && sidebarNav) {
            const navRect = sidebarNav.getBoundingClientRect()
            const elRect = el.getBoundingClientRect()
            const targetScrollTop =
              sidebarNav.scrollTop +
              (elRect.top - navRect.top) -
              navRect.height / 2 +
              elRect.height / 2
            sidebarNav.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
          }
        }

        setTimeout(() => {
          driverObj.movePrevious()
        }, 300)
      },
      onDestroyed: () => {
        isActive.value = false
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
        localStorage.removeItem(TOUR_STATE_KEY)
      },
    })
  }

  const startTour = (startIndex = 0) => {
    console.log('[Tour] startTour called, startIndex:', startIndex)
    if (!driverObj) {
      console.log('[Tour] Initializing driver...')
      initDriver()
    }
    if (driverObj) {
      console.log('[Tour] Starting driver.drive()')
      driverObj.drive(startIndex)
      isActive.value = true
    } else {
      console.error('[Tour] Driver failed to initialize!')
    }
  }

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    localStorage.removeItem(TOUR_STATE_KEY)
  }

  // Check if tour should auto-start for new users
  const checkAndAutoStart = () => {
    if (typeof window === 'undefined') return

    const isCompleted = localStorage.getItem(TOUR_COMPLETED_KEY)
    const isDashboard = route.path.includes('/dashboard')

    // Auto-start only if: not completed AND on dashboard page
    if (!isCompleted && isDashboard) {
      console.log('[Tour] Auto-starting for new user...')
      setTimeout(() => {
        startTour(0)
      }, 1500) // Wait for page to fully render
    }
  }

  return {
    startTour,
    resetTour,
    checkAndAutoStart,
    isActive,
  }
}
