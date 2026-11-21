import { useEffect, useState } from 'react'

export type StudioLocale = 'zh-CN' | 'zh-HK' | 'en'
const readLocale = (): StudioLocale => {
  const language = document.documentElement.lang
  return language === 'zh-HK' || language === 'en' ? language : 'zh-CN'
}

export function useStudioLocale() {
  const [locale, setLocale] = useState(readLocale)
  useEffect(() => {
    const observer = new MutationObserver(() => setLocale(readLocale()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [])
  return locale
}

export const studioLabels = {
  'zh-CN': { play: '开始放映', slogan: ['隐姓不埋名，缴械不投降。'] },
  'zh-HK': { play: '開始放映', slogan: ['隱姓不埋名，繳械不投降。'] },
  en: { play: 'Start screening', slogan: ['Anonymous, not forgotten.', 'Disarmed, never surrendered.'] },
} satisfies Record<StudioLocale, { play: string; slogan: string[] }>
