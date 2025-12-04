import Dexie, { Table } from 'dexie';

export interface GrammarCard {
  id: string;
  main_form: string;
  variants?: string[];
  search_keywords: string[];
  meaning: string;
  semantic_function: string;
  usage_context?: string[];
  proficiency_level: string;
  examples: {
    ja: string;
    zh: string;
    en: string;
    notes: string;
    context: string;
  }[];
  related_grammar?: string[];
}

export interface GrammarStats {
  grammarId: string;
  totalAttempts: number;
  knownCount: number;
  lastReviewed: Date;
  masteryRate: number;
}

export class GrammarDatabase extends Dexie {
  grammarCards!: Table<GrammarCard, string>;
  grammarStats!: Table<GrammarStats, string>;

  constructor() {
    super('GrammarDatabase');
    
    this.version(1).stores({
      grammarCards: 'id, main_form, proficiency_level',
      grammarStats: 'grammarId, totalAttempts, knownCount, lastReviewed, masteryRate'
    });
  }

  // 初始化语法卡片
  async initializeGrammarCards(data: GrammarCard[]) {
    const existingCards = await this.grammarCards.toArray();
    const existingIds = new Set(existingCards.map(card => card.id));
    
    const newCards = data.filter(card => !existingIds.has(card.id));
    
    if (newCards.length > 0) {
      await this.grammarCards.bulkAdd(newCards);
      console.log(`添加了 ${newCards.length} 个新的语法卡片`);
    }
  }

  // 获取所有卡片
  async getAllCards(): Promise<GrammarCard[]> {
    return await this.grammarCards.toArray();
  }

  // 获取或创建统计记录
  async getOrCreateStats(grammarId: string): Promise<GrammarStats> {
    const existing = await this.grammarStats.get(grammarId);
    
    if (existing) {
      return existing;
    }
    
    const newStats: GrammarStats = {
      grammarId,
      totalAttempts: 0,
      knownCount: 0,
      lastReviewed: new Date(0),
      masteryRate: 0
    };
    
    await this.grammarStats.add(newStats);
    return newStats;
  }

  // 更新统计
  async updateStats(grammarId: string, isKnown: boolean) {
    const stats = await this.getOrCreateStats(grammarId);
    
    stats.totalAttempts += 1;
    if (isKnown) {
      stats.knownCount += 1;
    }
    stats.lastReviewed = new Date();
    
    // 计算掌握率
    stats.masteryRate = stats.totalAttempts > 0 ? stats.knownCount / stats.totalAttempts : 0;
    
    await this.grammarStats.put(stats);
  }

  // 获取所有统计
  async getAllStats(): Promise<Map<string, GrammarStats>> {
    const stats = await this.grammarStats.toArray();
    const statsMap = new Map<string, GrammarStats>();
    
    stats.forEach(stat => {
      statsMap.set(stat.grammarId, stat);
    });
    
    return statsMap;
  }

  // 获取整体掌握率
  async getOverallMasteryRate(): Promise<number> {
    const stats = await this.grammarStats.toArray();
    
    if (stats.length === 0) return 0;
    
    const totalKnown = stats.reduce((sum, stat) => sum + stat.knownCount, 0);
    const totalAttempts = stats.reduce((sum, stat) => sum + stat.totalAttempts, 0);
    
    return totalAttempts > 0 ? totalKnown / totalAttempts : 0;
  }

  // 获取今日统计
  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await this.grammarStats
      .filter(stat => stat.lastReviewed >= today)
      .toArray();
    
    const reviewedCount = stats.length;
    // 简化处理：假设今日复习的卡片中，掌握率>0.5的为认识
    const knownToday = stats.filter(stat => stat.masteryRate > 0.5).length;
    
    return {
      reviewedCount,
      knownCount: knownToday,
      accuracy: reviewedCount > 0 ? knownToday / reviewedCount : 0
    };
  }


  // 重置所有统计
  async resetStats() {
    await this.grammarStats.clear();
  }

  // 获取需要复习的卡片
  async getCardsForReview(limit: number = 10): Promise<GrammarCard[]> {
    const cards = await this.getAllCards();
    const statsMap = await this.getAllStats();
    
    // 计算权重并排序
    const weightedCards = cards.map(card => {
      const stats = statsMap.get(card.id) || {
        grammarId: card.id,
        totalAttempts: 0,
        knownCount: 0,
        lastReviewed: new Date(0),
        masteryRate: 0
      };
      
      // 简单的权重计算：掌握率越低，权重越高
      const weight = (1 - stats.masteryRate) + (stats.totalAttempts === 0 ? 0.5 : 0);
      
      return {
        card,
        stats,
        weight
      };
    });
    
    // 按权重排序并返回前N个
    return weightedCards
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(item => item.card);
  }
}

export const db = new GrammarDatabase();