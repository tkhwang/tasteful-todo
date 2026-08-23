export default function Titlebar() {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="traffic-inset">
        <span className="mono crumb">goals/</span>
      </div>
      <div className="titlebar-center">
        <span className="filename">tasteful-todo</span>
      </div>
      <div className="titlebar-right" />
    </header>
  )
}
