import { BookOpen } from "lucide-react";
import { ContributionGrid } from "./ui/contribution-grid";
import { Card } from "./ui/card";

interface OverallStats {
  totalCards: number;
  overallMastery: number;
  todayReviewed: number;
}

interface ContributionDataItem {
  id: string;
  value: number;
  label?: string;
}

interface StatsSidebarProps {
  overallStats: OverallStats;
  contributionData: ContributionDataItem[];
}

export function StatsSidebar({
  overallStats,
  contributionData,
}: StatsSidebarProps) {
  return (
    <aside className="w-96 bg-transparent flex flex-col p-6">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold">日语语法背诵卡片</h1>
      </div>
      <Card className="p-6">
        {/* 统计卡片 */}
        <div className="space-y-6">
          <div className="bg-slate-50/70 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {Math.round(overallStats.overallMastery * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">整体掌握率</p>
            </div>
          </div>
          <div className="bg-slate-50/70 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {overallStats.totalCards}
              </p>
              <p className="text-sm text-muted-foreground">总卡片数</p>
            </div>
          </div>
          <div className="bg-slate-50/70 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {overallStats.todayReviewed}
              </p>
              <p className="text-sm text-muted-foreground">今日复习</p>
            </div>
          </div>
        </div>

        {/* 贡献图 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">语法知识点掌握程度</h3>
          <p className="text-sm text-muted-foreground mb-4">
            每个格子代表一个语法知识点，颜色越深表示掌握程度越高。
          </p>
          {contributionData.length > 0 ? (
            <ContributionGrid
              data={contributionData}
              columns={10}
              cellSize={20}
              showTooltip={true}
              onCellClick={(id, value) => {
                console.log(`Clicked ${id}: ${value}%`);
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          )}
        </div>
      </Card>
    </aside>
  );
}
