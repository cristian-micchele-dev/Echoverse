import { BG_CHARS } from './constants.js'

export default function ParecidoBg({ visible }) {
  return (
    <div className={`par-bg ${visible ? 'par-bg--visible' : ''}`} aria-hidden="true">
      <div className="par-bg-track par-bg-track--1">
        {BG_CHARS.map((c, i) => <img key={`t1-${c.id}-${i}`} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-track par-bg-track--2">
        {BG_CHARS.map((c, i) => <img key={`t2-${c.id}-${i}`} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-track par-bg-track--3">
        {BG_CHARS.map((c, i) => <img key={`t3-${c.id}-${i}`} src={c.image} alt="" className="par-bg-img" draggable={false} />)}
      </div>
      <div className="par-bg-overlay" />
    </div>
  )
}
