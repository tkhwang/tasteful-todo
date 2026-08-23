export default function Titlebar() {
  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="traffic-inset" data-tauri-drag-region>
        <span className="mono crumb" data-tauri-drag-region>
          goals/
        </span>
      </div>
      <div className="titlebar-center" data-tauri-drag-region>
        <span className="filename" data-tauri-drag-region>
          tasteful-todo
        </span>
      </div>
      <div className="titlebar-right" data-tauri-drag-region />
    </header>
  )
}
