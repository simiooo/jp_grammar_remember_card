import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmartReviewAlgorithm } from './algorithm.ts';
import type { GrammarStats, GrammarCard } from './db.ts';

describe('SmartReviewAlgorithm', () => {
  let algorithm: SmartReviewAlgorithm;

  beforeEach(() => {
    algorithm = new SmartReviewAlgorithm();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createStats = (
    totalAttempts: number,
    knownCount: number,
    lastReviewed: Date
  ): GrammarStats => ({
    grammarId: 'test',
    totalAttempts,
    knownCount,
    lastReviewed,
    masteryRate: totalAttempts > 0 ? knownCount / totalAttempts : 0,
    consecutiveKnown: 0,
  });

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  describe('calculateWeight', () => {
    it('should give low attempt bonus for 0 attempts', () => {
      const stats = createStats(0, 0, thirtyDaysAgo);
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: (1-0)*0.6 = 0.6
      // 随机性组件: 0.5*0.3 = 0.15
      // 最近复习时间组件: (30/30)*0.1 = 0.1
      // 低尝试次数加成: (3-0)*0.2 = 0.6
      // 高掌握率惩罚: 0
      // 总计: 0.6 + 0.15 + 0.1 + 0.6 = 1.45
      expect(weight).toBeCloseTo(1.45);
    });

    it('should give low attempt bonus for 1 attempt', () => {
      const stats = createStats(1, 1, oneDayAgo);
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: (1-1)*0.6 = 0
      // 随机性组件: 0.15
      // 最近复习时间组件: (1/30)*0.1 ≈ 0.00333
      // 低尝试次数加成: (3-1)*0.2 = 0.4
      // 高掌握率惩罚: 0 (因为尝试次数<3)
      // 总计: 0 + 0.15 + 0.00333 + 0.4 = 0.55333
      expect(weight).toBeCloseTo(0.55333, 5);
    });

    it('should give low attempt bonus for 2 attempts', () => {
      const stats = createStats(2, 1, oneDayAgo);
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: (1-0.5)*0.6 = 0.3
      // 随机性组件: 0.15
      // 最近复习时间组件: (1/30)*0.1 ≈ 0.00333
      // 低尝试次数加成: (3-2)*0.2 = 0.2
      // 高掌握率惩罚: 0
      // 总计: 0.3 + 0.15 + 0.00333 + 0.2 = 0.65333
      expect(weight).toBeCloseTo(0.65333, 5);
    });

    it('should apply mastery penalty for high mastery with >=3 attempts', () => {
      const stats = createStats(3, 3, oneDayAgo);
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: (1-1)*0.6 = 0
      // 随机性组件: 0.15
      // 最近复习时间组件: (1/30)*0.1 ≈ 0.00333
      // 低尝试次数加成: 0
      // 高掌握率惩罚: (1-0.8) = 0.2
      // 总计: 0 + 0.15 + 0.00333 - 0.2 = -0.04667
      expect(weight).toBeCloseTo(-0.04667, 5);
    });

    it('should not apply mastery penalty for mastery rate 0.8 with >=3 attempts', () => {
      const stats = createStats(5, 4, oneDayAgo); // masteryRate = 0.8
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: (1-0.8)*0.6 = 0.12
      // 随机性组件: 0.15
      // 最近复习时间组件: (1/30)*0.1 ≈ 0.00333
      // 低尝试次数加成: 0
      // 高掌握率惩罚: 0 (因为 masteryRate <= 0.8)
      // 总计: 0.12 + 0.15 + 0.00333 = 0.27333
      expect(weight).toBeCloseTo(0.27333, 5);
    });

    it('should consider recency weight for old reviews', () => {
      const stats = createStats(10, 10, thirtyDaysAgo);
      const weight = algorithm.calculateWeight(stats);
      // 掌握率组件: 0
      // 随机性组件: 0.15
      // 最近复习时间组件: (30/30)*0.1 = 0.1
      // 低尝试次数加成: 0
      // 高掌握率惩罚: 0.2 (因为 masteryRate > 0.8 且 attempts >=3)
      // 总计: 0 + 0.15 + 0.1 - 0.2 = 0.05
      expect(weight).toBeCloseTo(0.05);
    });
  });

  describe('filterCardsForReview', () => {
    const createWeightedCard = (id: string, weight: number = 1) => ({
      card: { id } as GrammarCard,
      weight,
    });

    it('should keep cards with less than 3 attempts regardless of mastery', () => {
      const weightedCards = [
        createWeightedCard('card1'),
        createWeightedCard('card2'),
      ];
      const statsMap = new Map<string, GrammarStats>();
      statsMap.set('card1', createStats(2, 2, oneDayAgo)); // 高掌握率但尝试次数<3
      statsMap.set('card2', createStats(1, 0, oneDayAgo)); // 低掌握率

      const filtered = algorithm.filterCardsForReview(weightedCards, statsMap);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(wc => wc.card.id)).toContain('card1');
      expect(filtered.map(wc => wc.card.id)).toContain('card2');
    });

    it('should filter out cards with high mastery and >5 attempts', () => {
      const weightedCards = [
        createWeightedCard('card1'),
        createWeightedCard('card2'),
      ];
      const statsMap = new Map<string, GrammarStats>();
      statsMap.set('card1', createStats(10, 10, oneDayAgo)); // 掌握率1.0，尝试次数>5
      statsMap.set('card2', createStats(6, 5, oneDayAgo)); // 掌握率<0.95，尝试次数>5

      const filtered = algorithm.filterCardsForReview(weightedCards, statsMap);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].card.id).toBe('card2');
    });

    it('should keep cards with high mastery but <=5 attempts', () => {
      const weightedCards = [createWeightedCard('card1')];
      const statsMap = new Map<string, GrammarStats>();
      statsMap.set('card1', createStats(5, 5, oneDayAgo)); // 掌握率1.0，尝试次数=5

      const filtered = algorithm.filterCardsForReview(weightedCards, statsMap);
      expect(filtered).toHaveLength(1);
    });
  });
});