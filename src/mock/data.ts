import { todayISO } from '../lib/date'
import type { CalendarEvent, Goal, Task, TimeBlock } from '../types'

export const mockGoals: readonly Goal[] = [
  { id: 'inbox', name: 'Inbox', colorKey: 'neutral', isInbox: true },
  {
    id: 'side-project',
    name: '사이드프로젝트',
    colorKey: 'pine',
    season: '2026 Q3 — tasteful-todo MVP를 출시한다.',
  },
  { id: 'job', name: '이직 준비', colorKey: 'blue' },
  { id: 'health', name: '건강', colorKey: 'amber' },
  { id: 'writing', name: '글쓰기', colorKey: 'plum' },
]

export const mockTasks: readonly Task[] = [
  { id: 't-inbox-1', goalId: 'inbox', text: '택배 반품', done: false },
  { id: 't-inbox-2', goalId: 'inbox', text: '세금 납부', done: false },
  {
    id: 't-landing',
    goalId: 'side-project',
    text: '랜딩페이지 초안',
    done: false,
    blockRefId: 'a1b2',
    note: '히어로 카피: "계획을 시간에 커밋하세요"',
  },
  { id: 't-logo', goalId: 'side-project', text: '로고 시안 검토', done: false },
  {
    id: 't-domain',
    goalId: 'side-project',
    text: '도메인 구매',
    done: true,
    blockRefId: 'c3d4',
  },
  {
    id: 't-tauri',
    goalId: 'side-project',
    text: 'Tauri 프로젝트 셋업',
    done: false,
  },
  {
    id: 't-resume',
    goalId: 'job',
    text: '이력서 다듬기',
    done: false,
    blockRefId: 'e5f6',
  },
  {
    id: 't-run',
    goalId: 'health',
    text: '러닝 5km',
    done: true,
    blockRefId: 'g7h8',
  },
  {
    id: 't-essay',
    goalId: 'writing',
    text: '에세이 퇴고',
    done: false,
    blockRefId: 'i9j0',
  },
]

const today = todayISO()

export const mockBlocks: readonly TimeBlock[] = [
  { id: 'b-run', date: today, startMin: 8 * 60, endMin: 8 * 60 + 40, taskId: 't-run' },
  {
    id: 'b-landing',
    date: today,
    startMin: 10 * 60,
    endMin: 11 * 60 + 30,
    taskId: 't-landing',
  },
  { id: 'b-lunch', date: today, startMin: 12 * 60, endMin: 13 * 60, title: '점심' },
  {
    id: 'b-essay',
    date: today,
    startMin: 14 * 60,
    endMin: 15 * 60 + 30,
    taskId: 't-essay',
  },
  {
    id: 'b-resume',
    date: today,
    startMin: 16 * 60,
    endMin: 17 * 60,
    taskId: 't-resume',
  },
]

export const mockCalendarEvents: readonly CalendarEvent[] = [
  {
    id: 'c-review',
    date: today,
    startMin: 9 * 60 + 30,
    endMin: 10 * 60,
    title: '주간 리뷰 콜',
  },
  {
    id: 'c-dinner',
    date: today,
    startMin: 18 * 60,
    endMin: 20 * 60,
    title: '가족 저녁',
  },
]
