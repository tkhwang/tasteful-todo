import Titlebar from './components/Titlebar'

export default function App() {
  return (
    <div className="app">
      <Titlebar />
      <div className="columns">
        <aside className="goals" aria-label="목표 목록" />
        <main className="editor" />
        <aside className="timeline" aria-label="하루 타임라인" />
      </div>
    </div>
  )
}
