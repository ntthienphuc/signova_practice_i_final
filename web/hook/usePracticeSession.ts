import { useState } from "react";
import { PracticeSession, ProgressByTopic, Topic } from "../src/types/learn";
import { AnalyzeResponse } from "../src/api";
import { shuffle, summarizeAnalysis } from "../src/utils/helpers";



function buildInitialSession(topic: Topic): PracticeSession {
  return {
    topic,
    wordIndex: 0,
    stage: "learn",
    quizScope: null,
    quizStartIndex: 0,
    quizReturnWordIndex: null,
    quizStandalone: false,
    quizQueue: [],
    quizRoundIndex: 0,
    currentQuizResults: [],
    quiz5Results: [],
    finalQuizResults: [],
    practiceResults: {},
  };
}

export function usePracticeSession() {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [progressByTopic, setProgressByTopic] = useState<ProgressByTopic>({});

  const updateTopicProgress = (topicId: string, patch: Partial<ProgressByTopic[string]>) => {
    setProgressByTopic((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? { completedWords: 0, completed: false }),
        ...patch,
      },
    }));
  };

  const syncProgressFromServer = (
    serverTopicProgress: Array<{ topic_id: string; completed_words: number; completed: boolean }>
  ) => {
    setProgressByTopic((prev) => {
      const next = { ...prev };
      for (const tp of serverTopicProgress) {
        const existing = next[tp.topic_id];
        next[tp.topic_id] = {
          completedWords: Math.max(tp.completed_words, existing?.completedWords ?? 0),
          completed: tp.completed || (existing?.completed ?? false),
        };
      }
      return next;
    });
  };

  const handleOpenTopic = (topic: Topic) => {
    setSession(buildInitialSession(topic));
    updateTopicProgress(topic.id, { completed: false });
  };

  const handleOpenTopicReview = (topic: Topic, startIndex = 0, scope: 5 | 10 = 10) => {
    const safeStart = Math.max(0, Math.min(startIndex, Math.max(0, topic.words.length - 1)));
    const safeScope = scope === 5 ? 5 : 10;
    const lessonWords = topic.words.slice(safeStart, safeStart + safeScope);
    const queue = shuffle(lessonWords.map((word) => word.gloss));
    setSession({
      ...buildInitialSession(topic),
      stage: "practice_ii",
      quizScope: safeScope,
      quizStartIndex: safeStart,
      quizReturnWordIndex: null,
      quizStandalone: true,
      quizQueue: queue,
      quizRoundIndex: 0,
    });
    updateTopicProgress(topic.id, { completed: false });
  };

  const handleBackToTopics = () => {
    setSession(null);
  };

  const handleRestartTopic = () => {
    if (!session) return;
    setSession(buildInitialSession(session.topic));
    updateTopicProgress(session.topic.id, { completedWords: 0, completed: false });
  };

  const handleStartWordPractice = () => {
    setSession((prev) => (prev ? { ...prev, stage: "practice_i" } : prev));
  };

  const handleGoToLearnWord = (nextIndex: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const requestedIndex = Number.isFinite(nextIndex) ? nextIndex : prev.wordIndex;
      const safeIndex = Math.max(0, Math.min(requestedIndex, prev.wordIndex));
      return { ...prev, wordIndex: safeIndex, stage: "learn" };
    });
  };

  const handlePracticeIComplete = (raw: AnalyzeResponse) => {
    if (!session) return;
    
    updateTopicProgress(session.topic.id, {
      completedWords: Math.max(
        session.wordIndex + 1,
        progressByTopic[session.topic.id]?.completedWords ?? 0
      ),
    });

    setSession((prev) => {
      if (!prev) return prev;
      const word = prev.topic.words[prev.wordIndex];
      const nextPracticeResults = {
        ...prev.practiceResults,
        [word.gloss]: summarizeAnalysis(raw),
      };

      if (prev.wordIndex === 4 && prev.quiz5Results.length === 0) {
        return {
          ...prev,
          practiceResults: nextPracticeResults,
          stage: "quiz_intro",
          quizScope: 5,
          quizStartIndex: 0,
          quizReturnWordIndex: 5,
          quizStandalone: false,
        };
      }

      if (prev.wordIndex >= prev.topic.words.length - 1) {
        return {
          ...prev,
          practiceResults: nextPracticeResults,
          stage: "quiz_intro",
          quizScope: 5,
          quizStartIndex: 5,
          quizReturnWordIndex: null,
          quizStandalone: false,
        };
      }

      return { ...prev, practiceResults: nextPracticeResults, wordIndex: prev.wordIndex + 1, stage: "learn" };
    });
  };

  const handleStartQuiz = () => {
    setSession((prev) => {
      if (!prev || !prev.quizScope) return prev;
      const startIndex = prev.quizStartIndex ?? 0;
      const queue = shuffle(prev.topic.words.slice(startIndex, startIndex + prev.quizScope).map((word) => word.gloss));
      return {
        ...prev,
        stage: "practice_ii",
        quizQueue: queue,
        quizRoundIndex: 0,
        currentQuizResults: [],
      };
    });
  };

  const handlePracticeIIComplete = (raw: AnalyzeResponse) => {
    if (!session || session.stage !== "practice_ii") return;

    setSession((prev) => {
      if (!prev || prev.stage !== "practice_ii") return prev;
      const result = summarizeAnalysis(raw);
      const nextResults = [...prev.currentQuizResults, result];
      const nextRound = prev.quizRoundIndex + 1;

      if (nextRound < prev.quizQueue.length) {
        return { ...prev, currentQuizResults: nextResults, quizRoundIndex: nextRound };
      }

      if (prev.quizStandalone) {
        return {
          ...prev,
          stage: "summary",
          quiz5Results: prev.quizScope === 5 ? nextResults : prev.quiz5Results,
          finalQuizResults: prev.quizScope === 10 ? nextResults : prev.finalQuizResults,
          currentQuizResults: [],
          quizQueue: [],
          quizRoundIndex: 0,
        };
      }

      if (prev.quizScope === 5) {
        if ((prev.quizStartIndex ?? 0) >= 5) {
          return {
            ...prev,
            stage: "quiz_intro",
            quizScope: 10,
            quizStartIndex: 0,
            quizReturnWordIndex: null,
            quizStandalone: false,
            quiz5Results: [...prev.quiz5Results, ...nextResults],
            currentQuizResults: [],
            quizQueue: [],
            quizRoundIndex: 0,
          };
        }

        return {
          ...prev,
          stage: "learn",
          wordIndex: prev.quizReturnWordIndex ?? 5,
          quiz5Results: nextResults,
          currentQuizResults: [],
          quizQueue: [],
          quizRoundIndex: 0,
        };
      }

      return {
        ...prev,
        stage: "summary",
        finalQuizResults: nextResults,
        currentQuizResults: [],
        quizQueue: [],
        quizRoundIndex: 0,
      };
    });

    if (session.quizScope === 10) {
      updateTopicProgress(session.topic.id, {
        completedWords: session.topic.word_count,
        completed: true,
      });
    }
  };

  return {
    session,
    progressByTopic,
    syncProgressFromServer,
    handleOpenTopic,
    handleOpenTopicReview,
    handleBackToTopics,
    handleRestartTopic,
    handleStartWordPractice,
    handleGoToLearnWord,
    handlePracticeIComplete,
    handleStartQuiz,
    handlePracticeIIComplete,
  };
}
