import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label="Toggle color theme">
      <motion.span key={theme} initial={{ rotate: -25, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </motion.span>
    </Button>
  )
}
