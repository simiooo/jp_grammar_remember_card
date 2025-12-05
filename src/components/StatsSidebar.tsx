import { BookOpen } from "lucide-react";
import { ContributionGrid } from "./ui/contribution-grid";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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
    <aside className="w-full lg:w-96 bg-transparent flex flex-col p-4 lg:p-6">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-6 lg:mb-8">
        <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
        <h1 className="text-lg lg:text-xl font-bold">日语语法背诵卡片</h1>
      </div>
      <Card className="p-6">
        {/* 移动端 Tabs (sm 及以下显示) */}
        <div className="sm:hidden">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">统计</TabsTrigger>
              <TabsTrigger value="mastery">掌握程度</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="space-y-4">
              {/* 统计卡片 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50/70 rounded-xl p-3 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(overallStats.overallMastery * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">整体掌握率</p>
                  </div>
                </div>
                <div className="bg-slate-50/70 rounded-xl p-3 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {overallStats.totalCards}
                    </p>
                    <p className="text-xs text-muted-foreground">总卡片数</p>
                  </div>
                </div>
                <div className="bg-slate-50/70 rounded-xl p-3 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {overallStats.todayReviewed}
                    </p>
                    <p className="text-xs text-muted-foreground">今日复习</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="mastery" className="space-y-4">
              <h3 className="text-base font-semibold">语法知识点掌握程度</h3>
              <p className="text-xs text-muted-foreground">
                每个格子代表一个语法知识点，颜色越深表示掌握程度越高。
              </p>
              {contributionData.length > 0 ? (
                <div className="overflow-x-auto pb-2">
                  <ContributionGrid
                    data={contributionData}
                    columns={10}
                    cellSize={20}
                    showTooltip={true}
                    onCellClick={(id, value) => {
                      console.log(`Clicked ${id}: ${value}%`);
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  加载中...
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* 桌面端布局 (sm 以上显示) */}
        <div className="hidden sm:block">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50/70 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {Math.round(overallStats.overallMastery * 100)}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">整体掌握率</p>
              </div>
            </div>
            <div className="bg-slate-50/70 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {overallStats.totalCards}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">总卡片数</p>
              </div>
            </div>
            <div className="bg-slate-50/70 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {overallStats.todayReviewed}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">今日复习</p>
              </div>
            </div>
          </div>

          {/* 贡献图 */}
          <div className="mt-6 lg:mt-8">
            <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">语法知识点掌握程度</h3>
            <p className="text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">
              每个格子代表一个语法知识点，颜色越深表示掌握程度越高。
            </p>
            {contributionData.length > 0 ? (
              <div className="overflow-x-auto pb-2">
                <ContributionGrid
                  data={contributionData}
                  columns={10}
                  cellSize={20}
                  showTooltip={true}
                  onCellClick={(id, value) => {
                    console.log(`Clicked ${id}: ${value}%`);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-6 lg:py-8 text-muted-foreground">
                加载中...
              </div>
            )}
          </div>
        </div>
      </Card>
    </aside>
  );
}
