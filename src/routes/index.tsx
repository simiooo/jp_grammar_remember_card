import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { GrammarCardComponent } from '../components/GrammarCard'
import { StatsSidebar } from '../components/StatsSidebar'
import { db } from '../lib/db'
import { reviewAlgorithm } from '../lib/algorithm'
import { WeightedCard } from '../lib/algorithm'
import { Button } from '../components/ui/button'
import { RefreshCw, Trophy, Target } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import grammarData from '../grammar_data.json'

export const Route = createFileRoute('/')({
  component: GrammarReviewApp,
})

function GrammarReviewApp() {
  const [currentCard, setCurrentCard] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAttempts: 0,
    knownCount: 0,
    masteryRate: 0,
  })
  const [weightedCards, setWeightedCards] = useState<WeightedCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [overallStats, setOverallStats] = useState({
    totalCards: 0,
    overallMastery: 0,
    todayReviewed: 0,
  })
  const [contributionData, setContributionData] = useState<
    Array<{ id: string; value: number; label?: string }>
  >([])
  const [cardAnimation, setCardAnimation] = useState<'idle' | 'exiting' | 'entering'>('idle')

  // 获取真实贡献数据（基于数据库掌握程度）
  async function fetchContributionData() {
    const [cards, statsMap] = await Promise.all([
      db.getAllCards(),
      db.getAllStats(),
    ]);
    return cards.map(card => {
      const stats = statsMap.get(card.id);
      const masteryRate = stats?.masteryRate ?? 0;
      const value = Math.round(masteryRate * 100); // 转换为百分比 0-100
      return {
        id: card.id,
        value,
        label: card.main_form,
      };
    });
  }

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 初始化语法卡片
        await db.initializeGrammarCards(grammarData)
        
        // 获取所有卡片和统计
        const [cards, statsMap, overallMastery, todayStats] = await Promise.all([
          db.getAllCards(),
          db.getAllStats(),
          db.getOverallMasteryRate(),
          db.getTodayStats(),
        ])

        // 计算加权卡片
        const weighted = reviewAlgorithm.getWeightedCards(cards, statsMap)
        const filtered = reviewAlgorithm.filterCardsForReview(weighted, statsMap)
        setWeightedCards(filtered)

        // 更新整体统计
        setOverallStats({
          totalCards: cards.length,
          overallMastery: overallMastery,
          todayReviewed: todayStats.reviewedCount,
        })

        // 生成真实贡献数据（基于掌握程度）
        const contributionData = cards.map(card => {
          const stats = statsMap.get(card.id);
          const masteryRate = stats?.masteryRate ?? 0;
          const value = Math.round(masteryRate * 100); // 转换为百分比 0-100
          return {
            id: card.id,
            value,
            label: card.main_form,
          };
        });
        setContributionData(contributionData);

        // 选择第一张卡片
        if (filtered.length > 0) {
          const firstCard = reviewAlgorithm.selectNextCard(filtered)
          await loadCard(firstCard)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('初始化失败:', error)
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  // 加载卡片
  const loadCard = async (card: any) => {
    setCurrentCard(card)
    const cardStats = await db.getOrCreateStats(card.id)
    setStats({
      totalAttempts: cardStats.totalAttempts,
      knownCount: cardStats.knownCount,
      masteryRate: cardStats.masteryRate,
    })
  }

  // 处理认识/不认识
  const handleResponse = async (isKnown: boolean) => {
    if (!currentCard) return

    try {
      // 触发退出动画
      setCardAnimation('exiting')
      
      // 更新统计
      await db.updateStats(currentCard.id, isKnown)
      
      // 重新加载当前卡片的统计
      const updatedStats = await db.getOrCreateStats(currentCard.id)
      setStats({
        totalAttempts: updatedStats.totalAttempts,
        knownCount: updatedStats.knownCount,
        masteryRate: updatedStats.masteryRate,
      })

      // 更新整体统计
      const [overallMastery, todayStats] = await Promise.all([
        db.getOverallMasteryRate(),
        db.getTodayStats(),
      ])
      
      setOverallStats(prev => ({
        ...prev,
        overallMastery: overallMastery,
        todayReviewed: todayStats.reviewedCount,
      }))

      // 更新贡献数据
      const contributionData = await fetchContributionData();
      setContributionData(contributionData);

      // 选择下一张卡片
      setTimeout(async () => {
        const cards = await db.getAllCards()
        const statsMap = await db.getAllStats()
        const weighted = reviewAlgorithm.getWeightedCards(cards, statsMap)
        const filtered = reviewAlgorithm.filterCardsForReview(weighted, statsMap)
        
        if (filtered.length > 0) {
          const nextCard = reviewAlgorithm.selectNextCard(filtered)
          await loadCard(nextCard)
          // 触发进入动画
          setCardAnimation('entering')
          // 350ms后动画结束，恢复空闲状态
          setTimeout(() => {
            setCardAnimation('idle')
          }, 350)
        }
      }, 350)
    } catch (error) {
      console.error('处理响应失败:', error)
      setCardAnimation('idle')
    }
  }

  // 手动切换卡片
  const handleNextCard = async () => {
    if (weightedCards.length === 0) return
    // 触发退出动画
    setCardAnimation('exiting')
    setTimeout(async () => {
      const nextCard = reviewAlgorithm.selectNextCard(weightedCards)
      await loadCard(nextCard)
      // 触发进入动画
      setCardAnimation('entering')
      setTimeout(() => {
        setCardAnimation('idle')
      }, 350)
    }, 350)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">正在加载语法卡片...</p>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">恭喜！</h2>
          <p className="text-muted-foreground">你已经掌握了所有语法卡片！</p>
          <Button onClick={async () => {
            await db.resetStats()
            window.location.reload()
          }}>
            重新开始
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex justify-center items-start">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row">
       

        {/* 侧边栏 (在移动端显示在上方) */}
        <div className="lg:order-2 order-1">
          <StatsSidebar
            overallStats={overallStats}
            contributionData={contributionData}
          />
        </div>

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto px-4 py-8 lg:order-1 order-2">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 进度指示器 */}
            <div className="flex items-center justify-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-sm">
                第 {stats.totalAttempts + 1} 轮复习
              </Badge>
            </div>

            {/* 语法卡片 */}
            <div className={`card-animation-wrapper ${cardAnimation === 'exiting' ? 'animate-card-exit' : cardAnimation === 'entering' ? 'animate-card-enter' : ''}`}>
              <GrammarCardComponent
                card={currentCard}
                stats={stats}
                onKnown={() => handleResponse(true)}
                onUnknown={() => handleResponse(false)}
              />
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={handleNextCard}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                下一张卡片
              </Button>
            </div>

            {/* 提示信息 */}
            <div className="text-center text-sm text-muted-foreground">
              <p>点击"认识"或"不认识"来记录你的学习进度</p>
              <p>系统会根据你的掌握情况智能推荐复习内容</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
