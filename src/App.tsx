import { Editor } from './components/Editor'
import { GoalList } from './components/GoalList'
import Titlebar from './components/Titlebar'

export default function App() {
  return (
    <div className="app">
      <Titlebar />
      <div className="columns">
        <GoalList />
        <Editor />
        <aside className="timeline" aria-label="하루 타임라인" />
      </div>
    </div>
  )
}
