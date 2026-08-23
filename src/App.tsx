import Titlebar from './components/Titlebar'

export default function App() {
  return (
    <div className="app">
      <Titlebar />
      <div className="columns">
        <aside className="goals" />
        <main className="editor" />
        <aside className="timeline" />
      </div>
    </div>
  )
}
