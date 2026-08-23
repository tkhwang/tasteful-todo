import { useApp } from '../store'

export default function Titlebar() {
  const selectedGoalId = useApp((state) => state.selectedGoalId)
  const selectedGoal = useApp((state) =>
    state.goals.find((goal) => goal.id === selectedGoalId),
  )
  const goPrevDay = useApp((state) => state.goPrevDay)
  const goToday = useApp((state) => state.goToday)
  const goNextDay = useApp((state) => state.goNextDay)

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="traffic-inset" data-tauri-drag-region>
        <span className="mono crumb" data-tauri-drag-region>
          goals/
        </span>
      </div>
      <div className="titlebar-center" data-tauri-drag-region>
        <span className="filename" data-tauri-drag-region>
          {selectedGoal === undefined ? '선택한 목표 없음' : `${selectedGoal.name}.md`}
        </span>
      </div>
      <div className="titlebar-right" data-tauri-drag-region>
        <nav className="datenav" aria-label="날짜 이동">
          <button className="chev" type="button" onClick={goPrevDay} aria-label="이전 날짜">
            ◀
          </button>
          <button className="today-btn" type="button" onClick={goToday} aria-label="오늘로 이동">
            오늘
          </button>
          <button className="chev" type="button" onClick={goNextDay} aria-label="다음 날짜">
            ▶
          </button>
        </nav>
      </div>
    </header>
  )
}
