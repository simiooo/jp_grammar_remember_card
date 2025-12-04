import { GrammarCard, GrammarStats } from './db';

export interface WeightedCard {
  card: GrammarCard;
  weight: number;
}

export class SmartReviewAlgorithm {
  private readonly masteryWeight = 0.6; // 掌握率权重
  private readonly randomnessWeight = 0.3; // 随机性权重
  private readonly recencyWeight = 0.1; // 最近复习时间权重
  
  private readonly masteryPenalty = 0.8; // 高掌握率的惩罚系数
  private readonly recencyDecay = 0.95; // 时间衰减系数
  
  // 计算卡片的权重
  private calculateWeight(stats: GrammarStats): number {
    // 1. 掌握率权重：掌握率越低，权重越高
    const masteryComponent = (1 - stats.masteryRate) * this.masteryWeight;
    
    // 2. 随机性权重：添加随机性避免模式化
    const randomComponent = Math.random() * this.randomnessWeight;
    
    // 3. 最近复习时间权重：越久没复习，权重越高
    const now = new Date();
    const daysSinceReview = (now.getTime() - stats.lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
    const recencyComponent = Math.min(daysSinceReview / 30, 1) * this.recencyWeight;
    
    // 4. 新卡片加成：从未复习过的卡片获得额外权重
    const newCardBonus = stats.totalAttempts === 0 ? 0.5 : 0;
    
    // 5. 高掌握率惩罚：如果掌握率很高，降低权重
    const masteryPenalty = stats.masteryRate > 0.8 ? (1 - this.masteryPenalty) : 0;
    
    return masteryComponent + randomComponent + recencyComponent + newCardBonus - masteryPenalty;
  }
  
  // 选择下一个要复习的卡片
  selectNextCard(weightedCards: WeightedCard[]): GrammarCard {
    if (weightedCards.length === 0) {
      throw new Error('No cards available for review');
    }
    
    // 计算总权重
    const totalWeight = weightedCards.reduce((sum, wc) => sum + wc.weight, 0);
    
    // 生成随机数
    let random = Math.random() * totalWeight;
    
    // 根据权重选择卡片
    for (const weightedCard of weightedCards) {
      random -= weightedCard.weight;
      if (random <= 0) {
        return weightedCard.card;
      }
    }
    
    // 如果由于浮点数精度问题没有选中，返回最后一个
    return weightedCards[weightedCards.length - 1].card;
  }
  
  // 获取一批加权卡片
  getWeightedCards(cards: GrammarCard[], statsMap: Map<string, GrammarStats>): WeightedCard[] {
    return cards.map(card => {
      const stats = statsMap.get(card.id) || {
        grammarId: card.id,
        totalAttempts: 0,
        knownCount: 0,
        lastReviewed: new Date(0),
        masteryRate: 0
      };
      
      return {
        card,
        weight: this.calculateWeight(stats)
      };
    });
  }
  
  // 获取推荐复习的卡片数量
  getRecommendedCardsCount(totalCards: number): number {
    // 根据总卡片数推荐复习数量
    if (totalCards <= 10) return totalCards;
    if (totalCards <= 30) return Math.floor(totalCards * 0.7);
    if (totalCards <= 50) return Math.floor(totalCards * 0.5);
    return Math.floor(totalCards * 0.3);
  }
  
  // 过滤需要复习的卡片
  filterCardsForReview(weightedCards: WeightedCard[], statsMap: Map<string, GrammarStats>): WeightedCard[] {
    // 移除掌握率过高的卡片（>95%且复习次数>5次）
    return weightedCards.filter(wc => {
      const stats = statsMap.get(wc.card.id) || {
        grammarId: wc.card.id,
        totalAttempts: 0,
        knownCount: 0,
        lastReviewed: new Date(0),
        masteryRate: 0
      };
      
      return !(stats.masteryRate > 0.95 && stats.totalAttempts > 5);
    });
  }
}

export const reviewAlgorithm = new SmartReviewAlgorithm();