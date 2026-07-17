import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2">出错了</h1>
            <p className="text-[var(--text-secondary)] mb-4">页面遇到了一个意外错误</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white cursor-pointer"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
