import { Editor } from './components/Editor'
import { GoalList } from './components/GoalList'
import Timeline from './components/Timeline'
import Titlebar from './components/Titlebar'

export default function App() {
  return (
    <div className="app">
      <Titlebar />
      <div className="columns">
        <GoalList />
        <Editor />
        <Timeline />
      </div>
    </div>
  )
}
