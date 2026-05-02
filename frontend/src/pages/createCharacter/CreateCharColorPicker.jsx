import { COLOR_PALETTE } from './constants.js'

export default function CreateCharColorPicker({ color, onColorChange }) {
  return (
    <div className="create-char-field">
      <label className="create-char-label">Color del tema</label>
      <div className="create-char-color-palette">
        {COLOR_PALETTE.map(c => (
          <button
            key={c}
            type="button"
            className={`create-char-color-swatch ${color === c ? 'create-char-color-swatch--active' : ''}`}
            style={{ background: c, '--swatch-color': c }}
            onClick={() => onColorChange(c)}
            aria-label={`Color ${c}`}
          />
        ))}
        <label className="create-char-color-custom" title="Color personalizado">
          <input
            type="color"
            value={color}
            onChange={e => onColorChange(e.target.value)}
          />
          <span>+</span>
        </label>
      </div>
    </div>
  )
}
