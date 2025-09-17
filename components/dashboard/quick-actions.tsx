'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Package, FolderOpen, MapPin, Users, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Package, FolderOpen, MapPin, Users, Sparkles, ArrowRight, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function QuickActions() {
  const router = useRouter()
  const t = useTranslations('quickActions')
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [clickedButton, setClickedButton] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const actions = [
    {
      id: 'addItem',
      label: t('addItem'),
      icon: Package,
      href: '/inventory/create',
      description: 'Agregar Artículo',
      shortDescription: 'Artículo',
      color: 'blue',
      gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20',
      darkGradient: 'from-blue-600/30 via-cyan-600/30 to-teal-600/30',
      iconGradient: 'from-blue-500 to-cyan-500',
      darkIconGradient: 'from-blue-400 to-cyan-400',
      borderGradient: 'from-blue-400/50 to-cyan-400/50',
      darkBorderGradient: 'from-blue-400/70 to-cyan-400/70'
    },
    {
      id: 'newCategory',
      label: t('newCategory'),
      icon: FolderOpen,
      href: '/categories/create',
      description: 'Nueva Categoría',
      shortDescription: 'Categoría',
      color: 'green',
      gradient: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
      darkGradient: 'from-emerald-600/30 via-green-600/30 to-lime-600/30',
      iconGradient: 'from-emerald-500 to-green-500',
      darkIconGradient: 'from-emerald-400 to-green-400',
      borderGradient: 'from-emerald-400/50 to-green-400/50',
      darkBorderGradient: 'from-emerald-400/70 to-green-400/70'
    },
    {
      id: 'addLocation',
      label: t('addLocation'),
      icon: MapPin,
      href: '/locations/create',
      description: 'Agregar Ubicación',
      shortDescription: 'Ubicación',
      color: 'purple',
      gradient: 'from-purple-500/20 via-violet-500/20 to-fuchsia-500/20',
      darkGradient: 'from-purple-600/30 via-violet-600/30 to-fuchsia-600/30',
      iconGradient: 'from-purple-500 to-violet-500',
      darkIconGradient: 'from-purple-400 to-violet-400',
      borderGradient: 'from-purple-400/50 to-violet-400/50',
      darkBorderGradient: 'from-purple-400/70 to-violet-400/70'
    },
    {
      id: 'addUser',
      label: t('addUser'),
      icon: Users,
      href: '/users/create',
      description: 'Agregar Usuario',
      shortDescription: 'Usuario',
      color: 'orange',
      gradient: 'from-orange-500/20 via-amber-500/20 to-yellow-500/20',
      darkGradient: 'from-orange-600/30 via-amber-600/30 to-yellow-600/30',
      iconGradient: 'from-orange-500 to-amber-500',
      darkIconGradient: 'from-orange-400 to-amber-400',
      borderGradient: 'from-orange-400/50 to-amber-400/50',
      darkBorderGradient: 'from-orange-400/70 to-amber-400/70'
    }
  ]

  const handleNavigation = (href: string, id: string) => {
    setClickedButton(id)
    setShowMobileMenu(false)
    setTimeout(() => {
      router.push(href)
      setClickedButton(null)
    }, 150)
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {/* Desktop: Enhanced glassmorphism design with improved dark mode */}
      <div className="hidden lg:flex items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Badge
            variant="secondary"
            className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 border-gray-200/50 dark:border-gray-600/60 px-5 py-2.5 text-sm font-semibold shadow-lg border-2"
          >
            <Sparkles className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
            Herramientas Rápidas
          </Badge>
        </motion.div>

        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            onHoverStart={() => setHoveredButton(action.id)}
            onHoverEnd={() => setHoveredButton(null)}
            className="relative"
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300 ease-out",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/60 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/80 dark:hover:bg-gray-700/90",
                "hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/50",
                "hover:scale-105 hover:-translate-y-2",
                "min-w-[200px] h-20",
                "relative overflow-hidden",
                clickedButton === action.id && "scale-95"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
            >
              {/* Animated gradient background - improved for dark mode */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />
              
              {/* Animated border gradient - enhanced for dark mode */}
              <div className={cn(
                "absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.borderGradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkBorderGradient
              )} style={{ padding: '2px' }}>
                <div className="w-full h-full bg-white/60 dark:bg-gray-800/80 backdrop-blur-md rounded-lg" />
              </div>

              <CardContent className="relative z-10 p-4 h-full">
                <div className="flex items-center gap-4 h-full">
                  {/* Enhanced icon with gradient background - improved dark mode */}
                  <motion.div
                    animate={{
                      scale: hoveredButton === action.id ? 1.15 : 1,
                      rotate: hoveredButton === action.id ? 10 : 0
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "relative p-3 rounded-xl bg-gradient-to-br shadow-lg",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient,
                      "text-white"
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                    
                    {/* Icon glow effect - enhanced for dark mode */}
                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-300",
                      action.iconGradient,
                      "dark:opacity-0 dark:group-hover:opacity-40",
                      action.darkIconGradient
                    )} />
                  </motion.div>

                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-bold text-sm leading-tight text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {action.description}
                    </span>
                  </div>

                  {/* Arrow indicator - improved dark mode */}
                  <motion.div
                    animate={{
                      x: hoveredButton === action.id ? 4 : 0,
                      opacity: hoveredButton === action.id ? 1 : 0.6
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </CardContent>

              {/* Ripple effect - enhanced for dark mode */}
              <AnimatePresence>
                {clickedButton === action.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "absolute inset-0 rounded-lg bg-gradient-to-br",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient
                    )}
                  />
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tablet: Enhanced compact design with improved dark mode */}
      <div className="hidden md:flex lg:hidden items-center gap-3 sm:gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/60 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/80 dark:hover:bg-gray-700/90",
                "hover:shadow-xl hover:scale-105",
                "min-w-[140px] sm:min-w-[160px] h-12 sm:h-14",
                "relative overflow-hidden"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />

              <CardContent className="relative z-10 p-2 sm:p-3 h-full">
                <div className="flex items-center gap-2 sm:gap-3 h-full">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "p-1.5 sm:p-2 rounded-lg bg-gradient-to-br shadow-md",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient,
                      "text-white"
                    )}
                  >
                    <action.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </motion.div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {action.shortDescription}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mobile: Enhanced floating design with improved dark mode and more options */}
      <div className="flex md:hidden items-center gap-2 sm:gap-3">
        {/* Primary Actions - Show 2 main actions */}
        {actions.slice(0, 2).map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/70 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/90 dark:hover:bg-gray-700/90",
                "hover:shadow-xl hover:scale-110",
                "h-12 w-12 sm:h-14 sm:w-14 p-0",
                "relative overflow-hidden"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
              title={action.label}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />

              <CardContent className="relative z-10 p-0 h-full flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className={cn(
                    "p-2 sm:p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                    action.iconGradient,
                    "dark:bg-gradient-to-br",
                    action.darkIconGradient,
                    "text-white"
                  )}
                >
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* More Options Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card
            className="h-12 w-12 sm:h-14 sm:w-14 p-0 border-2 border-dashed border-gray-300/50 dark:border-gray-500/60 hover:border-solid hover:bg-white/60 dark:hover:bg-gray-800/80 backdrop-blur-md transition-all duration-300 cursor-pointer group"
            title="Más opciones"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <CardContent className="p-0 h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: showMobileMenu ? 45 : [0, 90, 0] }}
                transition={{
                  duration: showMobileMenu ? 0.2 : 2,
                  repeat: showMobileMenu ? 0 : Infinity,
                  ease: "easeInOut"
                }}
                className="text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100"
              >
                {showMobileMenu ? (
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-600/50 rounded-lg shadow-xl p-2 min-w-[200px]"
            >
              <div className="space-y-1">
                {actions.slice(2).map((action, index) => (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        "group cursor-pointer transition-all duration-200",
                        "border border-white/20 dark:border-gray-600/50",
                        "bg-white/60 dark:bg-gray-800/80 backdrop-blur-md",
                        "hover:bg-white/80 dark:hover:bg-gray-700/90",
                        "hover:shadow-lg hover:scale-105",
                        "p-3",
                        "relative overflow-hidden"
                      )}
                      onClick={() => handleNavigation(action.href, action.id)}
                    >
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        action.gradient,
                        "dark:opacity-0 dark:group-hover:opacity-100",
                        action.darkGradient
                      )} />

                      <CardContent className="relative z-10 p-0">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "p-2 rounded-lg bg-gradient-to-br shadow-md",
                              action.iconGradient,
                              "dark:bg-gradient-to-br",
                              action.darkIconGradient,
                              "text-white"
                            )}
                          >
                            <action.icon className="h-4 w-4" />
                          </motion.div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {action.label}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                              {action.description}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Badge
            variant="secondary"
            className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-200 border-gray-200/50 dark:border-gray-600/60 px-5 py-2.5 text-sm font-semibold shadow-lg border-2"
          >
            <Sparkles className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
            Herramientas Rápidas
          </Badge>
        </motion.div>

        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            onHoverStart={() => setHoveredButton(action.id)}
            onHoverEnd={() => setHoveredButton(null)}
            className="relative"
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300 ease-out",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/60 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/80 dark:hover:bg-gray-700/90",
                "hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/50",
                "hover:scale-105 hover:-translate-y-2",
                "min-w-[200px] h-20",
                "relative overflow-hidden",
                clickedButton === action.id && "scale-95"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
            >
              {/* Animated gradient background - improved for dark mode */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />
              
              {/* Animated border gradient - enhanced for dark mode */}
              <div className={cn(
                "absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.borderGradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkBorderGradient
              )} style={{ padding: '2px' }}>
                <div className="w-full h-full bg-white/60 dark:bg-gray-800/80 backdrop-blur-md rounded-lg" />
              </div>

              <CardContent className="relative z-10 p-4 h-full">
                <div className="flex items-center gap-4 h-full">
                  {/* Enhanced icon with gradient background - improved dark mode */}
                  <motion.div
                    animate={{
                      scale: hoveredButton === action.id ? 1.15 : 1,
                      rotate: hoveredButton === action.id ? 10 : 0
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn(
                      "relative p-3 rounded-xl bg-gradient-to-br shadow-lg",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient,
                      "text-white"
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                    
                    {/* Icon glow effect - enhanced for dark mode */}
                    <div className={cn(
                      "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-300",
                      action.iconGradient,
                      "dark:opacity-0 dark:group-hover:opacity-40",
                      action.darkIconGradient
                    )} />
                  </motion.div>

                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-bold text-sm leading-tight text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                      {action.description}
                    </span>
                  </div>

                  {/* Arrow indicator - improved dark mode */}
                  <motion.div
                    animate={{
                      x: hoveredButton === action.id ? 4 : 0,
                      opacity: hoveredButton === action.id ? 1 : 0.6
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </CardContent>

              {/* Ripple effect - enhanced for dark mode */}
              <AnimatePresence>
                {clickedButton === action.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "absolute inset-0 rounded-lg bg-gradient-to-br",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient
                    )}
                  />
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tablet: Enhanced compact design with improved dark mode */}
      <div className="hidden md:flex lg:hidden items-center gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/60 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/80 dark:hover:bg-gray-700/90",
                "hover:shadow-xl hover:scale-105",
                "min-w-[160px] h-14",
                "relative overflow-hidden"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />

              <CardContent className="relative z-10 p-3 h-full">
                <div className="flex items-center gap-3 h-full">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "p-2 rounded-lg bg-gradient-to-br shadow-md",
                      action.iconGradient,
                      "dark:bg-gradient-to-br",
                      action.darkIconGradient,
                      "text-white"
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                  </motion.div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {action.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mobile: Enhanced floating design with improved dark mode */}
      <div className="flex md:hidden items-center gap-3">
        {actions.slice(0, 2).map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group cursor-pointer transition-all duration-300",
                "border-2 border-white/20 dark:border-gray-600/50",
                "bg-white/70 dark:bg-gray-800/80 backdrop-blur-md",
                "hover:bg-white/90 dark:hover:bg-gray-700/90",
                "hover:shadow-xl hover:scale-110",
                "h-14 w-14 p-0",
                "relative overflow-hidden"
              )}
              onClick={() => handleNavigation(action.href, action.id)}
              title={action.label}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                action.gradient,
                "dark:opacity-0 dark:group-hover:opacity-100",
                action.darkGradient
              )} />

              <CardContent className="relative z-10 p-0 h-full flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className={cn(
                    "p-2.5 rounded-xl bg-gradient-to-br shadow-lg",
                    action.iconGradient,
                    "dark:bg-gradient-to-br",
                    action.darkIconGradient,
                    "text-white"
                  )}
                >
                  <action.icon className="h-5 w-5" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card
            className="h-14 w-14 p-0 border-2 border-dashed border-gray-300/50 dark:border-gray-500/60 hover:border-solid hover:bg-white/60 dark:hover:bg-gray-800/80 backdrop-blur-md transition-all duration-300 cursor-pointer group"
            title="Más opciones"
          >
            <CardContent className="p-0 h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 90, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-gray-500 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-100"
              >
                <Plus className="h-5 w-5" />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}