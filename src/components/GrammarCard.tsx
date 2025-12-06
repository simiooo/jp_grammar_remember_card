import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ChevronLeft, ChevronRight, Volume2, BookOpen } from 'lucide-react';
import { GrammarCard as GrammarCardType } from '../lib/db.ts';
// import { useGestureRecognition } from '../hooks/useGestureRecognition';

interface GrammarCardProps {
  card: GrammarCardType;
  stats: {
    totalAttempts: number;
    knownCount: number;
    masteryRate: number;
  };
  onKnown: () => void;
  onUnknown: () => void;
}

export function GrammarCardComponent({ card, stats, onKnown, onUnknown }: GrammarCardProps) {
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  // const [showGestureControls, setShowGestureControls] = useState(false);

  // const {
  //   isDetecting,
  //   lastGesture,
  //   videoRef,
  //   startDetection,
  //   stopDetection,
  //   error
  // } = useGestureRecognition({
  //   onThumbUp: onKnown,
  //   onThumbDown: onUnknown,
  //   enabled: showGestureControls
  // });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === '1') {
        onUnknown();
      } else if (event.key === '2') {
        onKnown();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onKnown, onUnknown]);

  const currentExample = card.examples[currentExampleIndex];

  const handleNextExample = () => {
    setCurrentExampleIndex((prev) => (prev + 1) % card.examples.length);
  };

  const handlePrevExample = () => {
    setCurrentExampleIndex((prev) => (prev - 1 + card.examples.length) % card.examples.length);
  };

  const speakJapanese = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-primary">
            {card.main_form}
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {card.proficiency_level}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {card.search_keywords.slice(0, 3).map((keyword: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>掌握率</span>
            <span>{Math.round(stats.masteryRate * 100)}%</span>
          </div>
          <Progress value={stats.masteryRate * 100} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>已复习: {stats.totalAttempts}次</span>
            <span>认识: {stats.knownCount}次</span>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            onClick={onUnknown}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            不认识 (1)
          </Button>
          <Button
            onClick={onKnown}
            variant="default"
            size="lg"
            className="flex-1"
          >
            认识 (2)
          </Button>
          {/* <Button
            onClick={() => {
              if (showGestureControls) {
                stopDetection();
                setShowGestureControls(false);
              } else {
                startDetection();
                setShowGestureControls(true);
              }
            }}
            variant={showGestureControls ? "destructive" : "secondary"}
            size="lg"
            className="flex-1"
          >
            {showGestureControls ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {showGestureControls ? '关闭手势' : '手势控制'}
          </Button> */}
        </div>

        {/* {showGestureControls && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {isDetecting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    手势检测中...
                  </span>
                ) : (
                  <span>点击"手势控制"开始</span>
                )}
              </div>
              {lastGesture && (
                <Badge variant="outline" className="text-xs">
                  检测到手势: {lastGesture === 'Thumb_Up' ? '👍 认识' : lastGesture === 'Thumb_Down' ? '👎 不认识' : lastGesture}
                </Badge>
              )}
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md">
                ❌ {error}
              </div>
            )}
          </div>
        )} */}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            语法意义
          </h3>
          <p className="text-muted-foreground leading-relaxed">{card.meaning}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">用法说明</h3>
          <p className="text-muted-foreground leading-relaxed">{card.semantic_function}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">例句 ({currentExampleIndex + 1}/{card.examples.length})</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevExample}
                disabled={card.examples.length <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextExample}
                disabled={card.examples.length <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">日文</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => speakJapanese(currentExample.ja)}
                  className="h-8 w-8 p-0"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-lg font-medium">{currentExample.ja}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">中文翻译</span>
              <p className="text-base">{currentExample.zh}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">英文翻译</span>
              <p className="text-base text-muted-foreground">{currentExample.en}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">注释</span>
              <p className="text-sm text-muted-foreground">{currentExample.notes}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">使用场景</span>
              <Badge variant="outline" className="text-xs">
                {currentExample.context}
              </Badge>
            </div>
          </div>
        </div>

        {card.related_grammar && card.related_grammar.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">相关语法</h3>
            <div className="flex flex-wrap gap-2">
              {card.related_grammar.map((related: string, index: number) => (
                <Badge key={index} variant="outline">
                  {related}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* {isDetecting && (
        <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
      )} */}
    </Card>
  );
}