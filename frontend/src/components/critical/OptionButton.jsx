import './OptionButton.css'

export default function OptionButton({ option, onClick, disabled }) {
  return (
    <button
      className="option-btn"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="option-btn__label">{option.label}</span>
      <svg className="option-btn__arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
