type Props = { visible: boolean }

export const PasswordToggleIcon = ({ visible }: Props) => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    {visible ? (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c5.5 0 9 5 9 7a6.8 6.8 0 0 1-2.1 3.2" />
        <path d="M6.6 6.6C4.3 8.1 3 10.5 3 12c0 2 3.5 7 9 7 1.1 0 2.1-.2 3-.5" />
      </>
    ) : (
      <>
        <path d="M3 12c0-2 3.5-7 9-7s9 5 9 7-3.5 7-9 7-9-5-9-7z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
)