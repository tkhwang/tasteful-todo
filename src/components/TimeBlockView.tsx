import { fmtRange, minToY } from '../lib/time'
import type { Goal, Task, TimeBlock } from '../types'

type TimeBlockViewProps = {
  readonly block: TimeBlock
  readonly task?: Task | undefined
  readonly goal?: Goal | undefined
}

type BlockPresentation = {
  readonly title: string
  readonly variantClass: string
}

function blockPresentation(block: TimeBlock, task?: Task, goal?: Goal): BlockPresentation {
  if (block.taskId === undefined) {
    return { title: block.title ?? '제목 없는 블록', variantClass: 'free' }
  }
  if (task === undefined || goal === undefined) {
    return { title: '연결이 끊어진 블록', variantClass: 'mine invalid' }
  }
  return {
    title: `${task.text}${task.done ? ' ✓' : ''}`,
    variantClass: `mine ck-block-${goal.colorKey}`,
  }
}

export default function TimeBlockView({ block, task, goal }: TimeBlockViewProps) {
  const duration = block.endMin - block.startMin
  const isCompact = duration <= 40
  const isUltraCompact = duration <= 15
  const densityClass = `${isCompact ? ' compact' : ''}${isUltraCompact ? ' ultra-compact' : ''}`
  const { title, variantClass } = blockPresentation(block, task, goal)

  return (
    <div
      className={`block ${variantClass}${task?.done === true ? ' past' : ''}${densityClass}`}
      style={{
        top: minToY(block.startMin),
        height: minToY(block.endMin - block.startMin),
      }}
      data-block-id={block.id}
      aria-label={`${title}, ${fmtRange(block.startMin, block.endMin)}`}
    >
      {!isCompact && (
        <span className="t mono">{fmtRange(block.startMin, block.endMin)}</span>
      )}
      <span className="n">{title}</span>
      <span className="resize" aria-hidden="true" />
    </div>
  )
}
